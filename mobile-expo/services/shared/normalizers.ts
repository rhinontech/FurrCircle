const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseTimeTo24Hour = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const twentyFourHour = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (twentyFourHour) {
    const [, hours, minutes, seconds] = twentyFourHour;
    return `${hours.padStart(2, '0')}:${minutes}:${seconds || '00'}`;
  }

  const meridiem = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiem) {
    let hours = Number(meridiem[1]);
    const minutes = meridiem[2];
    const period = meridiem[3].toUpperCase();

    if (period === 'PM' && hours < 12) {
      hours += 12;
    }

    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, '0')}:${minutes}:00`;
  }

  return null;
};

const combineDateAndTime = (dateValue?: string | null, timeValue?: string | null) => {
  if (!dateValue) {
    return null;
  }

  if (dateValue.includes('T') && !timeValue) {
    return dateValue;
  }

  const datePart = dateValue.split('T')[0];
  const timePart = parseTimeTo24Hour(timeValue) || '09:00:00';
  return `${datePart}T${timePart}`;
};

const sortByDateTimeAsc = (a: any, b: any) => `${a?.appointment_date || a?.date || ''} ${a?.appointment_time || a?.time || ''}`.localeCompare(`${b?.appointment_date || b?.date || ''} ${b?.appointment_time || b?.time || ''}`);

const sortByTimestampDesc = (a: any, b: any) => `${b?.timestamp || b?.createdAt || b?.date || ''}`.localeCompare(`${a?.timestamp || a?.createdAt || a?.date || ''}`);

const inferHealthScore = (pet: any) => {
  const status = String(pet?.healthStatus || '').toLowerCase();

  if (!status || status.includes('healthy')) {
    return 95;
  }

  if (status.includes('due') || status.includes('check')) {
    return 84;
  }

  if (status.includes('recover') || status.includes('med')) {
    return 78;
  }

  return 72;
};

export const normalizeProfile = (profile: any) => {
  if (!profile) {
    return null;
  }

  const role = String(profile.role || (profile.hospital_name || profile.profession ? 'veterinarian' : 'owner')).toLowerCase();

  return {
    ...profile,
    role: role === 'vet' ? 'veterinarian' : role,
    avatar: profile.avatar ?? profile.avatar_url,
    avatar_url: profile.avatar_url ?? profile.avatar,
    isVerified: typeof profile.isVerified === 'boolean' ? profile.isVerified : profile.verified,
    clinic_name: profile.clinic_name ?? profile.hospital_name ?? profile.name,
    specialty: profile.specialty ?? profile.profession,
    yearsExp: profile.yearsExp ?? profile.experience,
    working_hours: profile.working_hours,
    address: profile.address,
  };
};

export const normalizePetLite = (pet: any) => {
  if (!pet) {
    return null;
  }

  return {
    ...pet,
    age: pet.age != null ? String(pet.age) : pet.age,
    owner: normalizeProfile(pet.owner),
  };
};

export const normalizeVaccine = (vaccine: any) => {
  if (!vaccine) {
    return null;
  }

  const v = vaccine.vet;
  return {
    ...vaccine,
    status: vaccine.status || (vaccine.nextDueDate ? 'due' : 'done'),
    lastVaccinationDate: vaccine.lastVaccinationDate ?? vaccine.dateAdministered ?? null,
    // Flatten vet/clinic info for easy access on the certificate
    vetProfile: v ? {
      name: v.name,
      clinicName: v.hospital_name,
      clinicLogo: v.clinicStampUrl || v.avatar_url || null,
      licenseNumber: v.licenseNumber || null,
      address: v.address || null,
    } : null,
  };
};

export const normalizeMedication = (medication: any) => {
  if (!medication) {
    return null;
  }

  return {
    ...medication,
    isActive: medication.isActive ?? !medication.endDate,
    imageUrl: medication.imageUrl,
  };
};

export const normalizeAllergy = (allergy: any) => {
  if (!allergy) {
    return null;
  }

  return {
    ...allergy,
    diagnosedAt: allergy.diagnosedAt ?? allergy.createdAt,
  };
};

export const normalizeMedicalRecord = (record: any) => {
  if (!record) {
    return null;
  }

  return {
    ...record,
    title: record.title ?? record.type ?? 'Medical Visit',
    clinic_name: record.clinic_name ?? record.description ?? '',
    veterinarian_name: record.veterinarian_name ?? record.veterinarian ?? '',
    imageUrl: record.imageUrl,
  };
};

export const normalizeAppointment = (appointment: any) => {
  if (!appointment) {
    return null;
  }

  return {
    ...appointment,
    reason: appointment.reason ?? appointment.description ?? '',
    owner: normalizeProfile(appointment.owner),
    veterinarian: normalizeProfile(appointment.veterinarian),
    pet: normalizePetLite(appointment.pet),
    appointment_date: appointment.appointment_date ?? appointment.date,
    appointment_time: appointment.appointment_time ?? appointment.time,
  };
};

export const normalizeReminder = (reminder: any) => {
  if (!reminder) {
    return null;
  }

  return {
    ...reminder,
    pet: normalizePetLite(reminder.pet),
  };
};

export const normalizePet = (pet: any) => {
  if (!pet) {
    return null;
  }

  const appointments = (pet.Appointments || []).map(normalizeAppointment).filter(Boolean).sort(sortByDateTimeAsc);
  const nextVisit =
    pet.nextVisit ||
    appointments.find((appointment: any) => ['pending', 'confirmed'].includes(String(appointment.status || '').toLowerCase()))?.appointment_date ||
    '--';

  return {
    ...normalizePetLite(pet),
    reminderCount: toNumber(pet.reminderCount, 0),
    healthScore: pet.healthScore ?? inferHealthScore(pet),
    nextVisit,
    Vaccines: (pet.Vaccines || []).map(normalizeVaccine).filter(Boolean),
    Medications: (pet.Medications || []).map(normalizeMedication).filter(Boolean),
    Allergies: (pet.Allergies || []).map(normalizeAllergy).filter(Boolean),
    Appointments: appointments,
  };
};

export const normalizePost = (post: any) => {
  if (!post) {
    return null;
  }

  return {
    ...post,
    author: normalizeProfile(post.author),
    likes: Array.isArray(post.likes) ? post.likes.map((like: any) => ({ userId: String(like.userId) })) : [],
    savedBy: Array.isArray(post.savedBy)
      ? post.savedBy.map((value: any) => String(value))
      : Array.isArray(post.savedPosts)
        ? post.savedPosts.map((value: any) => String(value.userId))
        : [],
    shareCount: toNumber(post.shareCount, 0),
    comments: (post.comments || []).map((comment: any) => ({
      ...comment,
      author: normalizeProfile(comment.author),
    })),
  };
};

export const normalizeEvent = (event: any) => {
  if (!event) {
    return null;
  }

  const host = normalizeProfile(event.host ?? event.organizer);
  const normalizedDate = combineDateAndTime(event.date, event.time);

  return {
    ...event,
    host,
    date: normalizedDate ?? event.date,
    time: event.time ?? (normalizedDate ? normalizedDate.split('T')[1]?.slice(0, 5) : undefined),
    venue: event.venue ?? event.location,
    address: event.address ?? event.location,
    attendeeCount: toNumber(event.attendeeCount, Array.isArray(event.bookings) ? event.bookings.length : 0),
    contactEmail: event.contactEmail ?? host?.email ?? null,
    isBooked: Boolean(event.isBooked),
  };
};

export const normalizeConversation = (conversation: any) => {
  if (!conversation) {
    return null;
  }

  const participants = (conversation.participants || []).map(normalizeProfile).filter(Boolean);
  const otherParticipants = (conversation.otherParticipants || []).map(normalizeProfile).filter(Boolean);
  const messages = (conversation.messages || [])
    .map((message: any) => ({
      ...message,
      sender: normalizeProfile(message.sender),
    }))
    .sort(sortByTimestampDesc)
    .reverse();
  const lastMessage = conversation.lastMessage
    ? {
        ...conversation.lastMessage,
        sender: normalizeProfile(conversation.lastMessage.sender),
      }
    : messages[messages.length - 1] || null;

  return {
    ...conversation,
    title: conversation.title || otherParticipants[0]?.clinic_name || otherParticipants[0]?.name || 'Conversation',
    participants,
    otherParticipants,
    pet: normalizePetLite(conversation.pet),
    messages,
    lastMessage,
  };
};

export const normalizeVitals = (vitals: any[] = []) => {
  const entries = vitals.flatMap((item: any) => {
    if (!item) {
      return [];
    }

    if (item.type && item.value !== undefined) {
      return [
        {
          ...item,
          value: String(item.value),
          timestamp: item.timestamp ?? item.createdAt ?? new Date().toISOString(),
        },
      ];
    }

    const timestamp = item.timestamp ?? item.createdAt ?? new Date().toISOString();
    const normalized: any[] = [];

    if (item.weight != null) {
      normalized.push({ id: `${item.id}_weight`, sourceId: item.id, type: 'Weight', value: String(item.weight), unit: 'kg', timestamp });
    }
    if (item.heartRate != null) {
      normalized.push({ id: `${item.id}_heartRate`, sourceId: item.id, type: 'Heart Rate', value: String(item.heartRate), unit: 'bpm', timestamp });
    }
    if (item.temperature != null) {
      normalized.push({ id: `${item.id}_temperature`, sourceId: item.id, type: 'Temperature', value: String(item.temperature), unit: 'F', timestamp });
    }
    if (item.bloodPressure) {
      normalized.push({ id: `${item.id}_bloodPressure`, sourceId: item.id, type: 'Blood Pressure', value: String(item.bloodPressure), unit: 'mmHg', timestamp });
    }

    return normalized;
  });

  return entries.sort(sortByTimestampDesc);
};
