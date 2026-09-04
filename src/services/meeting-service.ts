import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateMeetingInput,
  UpdateMeetingInput,
  MeetingFiltersInput,
  RecordMinutesInput,
} from "@/lib/validations/meeting";
import { formatDate } from "@/lib/format";
import { notifyMeetingCreated } from "@/services/notification-service";

export async function listMeetings(
  tenantId: string,
  filters: MeetingFiltersInput,
) {
  const where: Prisma.MeetingWhereInput = { tenantId };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { location: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.meetingType) where.meetingType = filters.meetingType;
  if (filters.from || filters.to) {
    where.date = {};
    if (filters.from) where.date.gte = filters.from;
    if (filters.to) where.date.lte = filters.to;
  }

  const orderBy: Prisma.MeetingOrderByWithRelationInput = {
    [filters.sortBy]: filters.sortDir,
  };

  const [items, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        attendees: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return {
    items,
    total,
    page: filters.page,
    limit: filters.limit,
    totalPages: Math.ceil(total / filters.limit),
  };
}

export async function getMeeting(tenantId: string, id: string) {
  return prisma.meeting.findFirst({
    where: { id, tenantId },
    include: {
      attendees: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      },
    },
  });
}

export async function createMeeting(
  tenantId: string,
  userId: string,
  input: CreateMeetingInput,
) {
  const created = await prisma.$transaction(async (tx) => {
    const meeting = await tx.meeting.create({
      data: {
        tenantId,
        title: input.title,
        date: input.date,
        time: input.time,
        duration: input.duration,
        meetingType: input.meetingType,
        location: input.location ?? null,
        isVirtual: input.isVirtual ?? false,
        meetingLink: input.meetingLink ?? null,
        notes: input.notes ?? null,
        status: input.status ?? "SCHEDULED",
        minutesUrl: input.minutesUrl || null,
        minutesName: input.minutesName ?? null,
        attendees: input.attendees?.length
          ? {
              create: input.attendees
                .filter((a) => a.userId || a.externalName)
                .map((a) => ({
                  userId: a.userId || null,
                  externalName: a.externalName || null,
                  externalEmail: a.externalEmail || null,
                })),
            }
          : undefined,
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "created",
        entity: "meeting",
        entityId: meeting.id,
        details: JSON.stringify({ title: meeting.title }),
      },
    });
    return meeting;
  });

  // إشعار كل المدعوين من أعضاء المكتب (ما عدا من أنشأ الاجتماع)
  const attendeeIds = (input.attendees ?? [])
    .map((a) => a.userId)
    .filter((id): id is string => !!id && id !== userId);

  if (attendeeIds.length) {
    await notifyMeetingCreated({
      tenantId,
      meetingId: created.id,
      title: created.title,
      dateLabel: formatDate(created.date),
      time: created.time,
      attendeeIds,
    });
  }

  return created;
}

export async function updateMeeting(
  tenantId: string,
  userId: string,
  id: string,
  input: UpdateMeetingInput,
) {
  const existing = await prisma.meeting.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.meeting.update({
      where: { id },
      data: {
        title: input.title,
        date: input.date,
        time: input.time,
        duration: input.duration,
        meetingType: input.meetingType,
        location: input.location,
        isVirtual: input.isVirtual,
        meetingLink: input.meetingLink,
        notes: input.notes,
        status: input.status,
        minutesUrl: input.minutesUrl !== undefined ? input.minutesUrl || null : undefined,
        minutesName: input.minutesName !== undefined ? input.minutesName || null : undefined,
      },
    });

    if (input.attendees) {
      await tx.meetingAttendee.deleteMany({ where: { meetingId: id } });
      if (input.attendees.length) {
        await tx.meetingAttendee.createMany({
          data: input.attendees
            .filter((a) => a.userId || a.externalName)
            .map((a) => ({
              meetingId: id,
              userId: a.userId || null,
              externalName: a.externalName || null,
              externalEmail: a.externalEmail || null,
            })),
        });
      }
    }

    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "updated",
        entity: "meeting",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function recordMeetingMinutes(
  tenantId: string,
  userId: string,
  id: string,
  input: RecordMinutesInput,
) {
  const existing = await prisma.meeting.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.meeting.update({
      where: { id },
      data: {
        notes: input.notes,
        minutesUrl: input.minutesUrl || null,
        minutesName: input.minutesName ?? null,
        status: "COMPLETED",
      },
    });
    await tx.activity.create({
      data: {
        tenantId,
        userId,
        action: "minutes_recorded",
        entity: "meeting",
        entityId: id,
      },
    });
    return updated;
  });
}

export async function deleteMeeting(
  tenantId: string,
  userId: string,
  id: string,
) {
  const existing = await prisma.meeting.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) return null;

  await prisma.$transaction([
    prisma.meeting.update({ where: { id }, data: { status: "CANCELLED" } }),
    prisma.activity.create({
      data: {
        tenantId,
        userId,
        action: "cancelled",
        entity: "meeting",
        entityId: id,
      },
    }),
  ]);
  return existing;
}

export async function getUpcomingMeetings(tenantId: string, take = 5) {
  return prisma.meeting.findMany({
    where: {
      tenantId,
      status: "SCHEDULED",
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
    take,
    include: {
      attendees: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
}
