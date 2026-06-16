import type { Request, Response } from "express";
import db from "../models/index.ts";
import { Op } from "sequelize";
import { createRichNotification } from "../services/notificationService.ts";

// @desc    Get all pending community posts
// @route   GET /api/admin/pending-posts
export const getPendingPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, vets: Vet } = db as any;
    const posts = await Post.findAll({
      where: { status: 'pending' },
      include: [
        { model: User, as: 'author', attributes: ['name', 'role', 'avatar_url'] },
        { model: Vet, as: 'vetAuthor', attributes: ['name', 'profession', 'avatar_url'] },
      ]
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or Reject a post
// @route   PATCH /api/admin/post-moderation/:postId
export const moderatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post } = db as any;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: "Invalid status. Must be 'approved' or 'rejected'." });
      return;
    }

    const post = await Post.findByPk(req.params.postId);
    if (!post) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    post.status = status;
    await post.save();

    res.json({ message: `Post ${status} successfully`, post });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unverified veterinarians (from Vet table)
// @route   GET /api/admin/vets/pending
export const getUnverifiedVets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vets = await Vet.findAll({
      where: { isVerified: false },
      attributes: { exclude: ['password'] }
    });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify a veterinarian
// @route   PATCH /api/admin/vets/:vetId/verify
export const verifyVet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vet = await Vet.findByPk(req.params.vetId);
    if (!vet) {
      res.status(404).json({ message: "Veterinarian not found" });
      return;
    }

    vet.isVerified = true;
    await vet.save();

    res.json({ message: "Veterinarian verified successfully", vet });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pets across ecosystem
// @route   GET /api/admin/pets
export const getAllPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User } = db as any;
    const pets = await Pet.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email'] }
      ]
    });
    res.json(pets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users in the system
// @route   GET /api/admin/users
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { users: User } = db as any;
    const users = await User.findAll({
      attributes: { exclude: ['password', 'otpCode', 'otpExpiry', 'resetToken', 'resetTokenExpiry'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vets (verified and unverified)
// @route   GET /api/admin/vets
export const getAllVets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { vets: Vet } = db as any;
    const vets = await Vet.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(vets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete (ban) a user
// @route   DELETE /api/admin/users/:userId
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      users: User,
      pets: Pet,
      vaccines: Vaccine,
      medical_records: MedicalRecord,
      medications: Medication,
      allergies: Allergy,
      appointments: Appointment,
      reminders: Reminder,
      vitals: Vital,
      adoption_applications: AdoptionApplication,
      conversations: Conversation,
      messages: Message,
      playdate_likes: PlaydateLike,
      follows: Follow,
      vet_reviews: VetReview,
      vets: Vet,
      posts: Post,
      comments: Comment,
      likes: Like,
      saved_posts: SavedPost,
      events: Event,
      event_bookings: EventBooking,
      saved_vets: SavedVet,
      stories: Story,
      story_views: StoryView,
      lost_pets: LostPet,
      circle_members: CircleMember,
      circles: Circle,
      questions: Question,
      question_answers: QuestionAnswer,
      question_votes: QuestionVote,
      owner_likes: OwnerLike,
      reports: Report,
      user_blocks: UserBlock,
      notifications: Notification,
      notification_devices: NotificationDevice,
      notification_preferences: NotificationPreference,
    } = db as any;

    const userId = req.params.userId;
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      res.status(404).json({ message: "User not found" });
      return;
    }

    // 1. Delete user's pets and their associated records
    const petIds = (await Pet.findAll({ where: { ownerId: userId }, attributes: ['id'], transaction })).map((p: any) => p.id);
    if (petIds.length > 0) {
      await Vaccine.destroy({ where: { petId: petIds }, transaction });
      await MedicalRecord.destroy({ where: { petId: petIds }, transaction });
      await Medication.destroy({ where: { petId: petIds }, transaction });
      await Allergy.destroy({ where: { petId: petIds }, transaction });
      await Appointment.destroy({ where: { petId: petIds }, transaction });
      await Reminder.destroy({ where: { petId: petIds }, transaction });
      await Vital.destroy({ where: { petId: petIds }, transaction });
      await AdoptionApplication.destroy({ where: { petId: petIds }, transaction });
      await Message.destroy({ where: { petId: petIds }, transaction });
      await Conversation.destroy({ where: { petId: petIds }, transaction });
      await PlaydateLike.destroy({
        where: {
          [Op.or]: [
            { swiperPetId: petIds },
            { targetPetId: petIds }
          ]
        },
        transaction
      });
      await Pet.destroy({ where: { id: petIds }, transaction });
    }

    // 2. Delete follows
    await Follow.destroy({
      where: {
        [Op.or]: [
          { followerId: userId },
          { followingId: userId }
        ]
      },
      transaction
    });

    // 3. Delete vet reviews and recalculate ratings
    const userReviews = await VetReview.findAll({ where: { userId }, attributes: ['vetId'], transaction });
    await VetReview.destroy({ where: { userId }, transaction });
    const affectedVetIds = Array.from(new Set(userReviews.map((r: any) => r.vetId)));
    for (const vId of affectedVetIds) {
      const allReviews = await VetReview.findAll({ where: { vetId: vId }, transaction });
      const vet = await Vet.findByPk(vId, { transaction });
      if (vet) {
        vet.rating = allReviews.length > 0
          ? Math.round((allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / allReviews.length) * 10) / 10
          : 0;
        await vet.save({ transaction });
      }
    }

    // 4. Appointments
    await Appointment.destroy({ where: { ownerId: userId }, transaction });

    // 5. Posts authored by user
    const postIds = (await Post.findAll({ where: { userId }, attributes: ['id'], transaction })).map((p: any) => p.id);
    if (postIds.length > 0) {
      await Comment.destroy({ where: { postId: postIds }, transaction });
      await Like.destroy({ where: { postId: postIds }, transaction });
      await SavedPost.destroy({ where: { postId: postIds }, transaction });
      await Post.destroy({ where: { id: postIds }, transaction });
    }

    // 6. Comments, likes, saved_posts
    await Comment.destroy({ where: { userId }, transaction });
    await Like.destroy({ where: { userId }, transaction });
    await SavedPost.destroy({ where: { userId }, transaction });

    // 7. Events organized by user and their bookings
    const eventIds = (await Event.findAll({ where: { organizerId: userId }, attributes: ['id'], transaction })).map((e: any) => e.id);
    if (eventIds.length > 0) {
      await EventBooking.destroy({ where: { eventId: eventIds }, transaction });
      await Event.destroy({ where: { id: eventIds }, transaction });
    }

    // 8. Event bookings, reminders, saved vets
    await EventBooking.destroy({ where: { userId }, transaction });
    await Reminder.destroy({ where: { userId }, transaction });
    await SavedVet.destroy({ where: { userId }, transaction });

    // 9. Adoption Applications where applicant or owner
    await AdoptionApplication.destroy({
      where: {
        [Op.or]: [
          { applicantId: userId },
          { ownerId: userId }
        ]
      },
      transaction
    });

    // 10. Stories authored by user
    const storyIds = (await Story.findAll({ where: { userId }, attributes: ['id'], transaction })).map((s: any) => s.id);
    if (storyIds.length > 0) {
      await StoryView.destroy({ where: { storyId: storyIds }, transaction });
      await Story.destroy({ where: { id: storyIds }, transaction });
    }
    await StoryView.destroy({ where: { viewerId: userId }, transaction });

    // 11. Lost pets, circles member
    await LostPet.destroy({ where: { userId }, transaction });
    await CircleMember.destroy({ where: { userId }, transaction });

    // 12. Circles created by user
    const circleIds = (await Circle.findAll({ where: { createdBy: userId }, attributes: ['id'], transaction })).map((c: any) => c.id);
    for (const cId of circleIds) {
      const qIds = (await Question.findAll({ where: { circleId: cId }, attributes: ['id'], transaction })).map((q: any) => q.id);
      if (qIds.length > 0) {
        await QuestionAnswer.destroy({ where: { questionId: qIds }, transaction });
        await QuestionVote.destroy({ where: { questionId: qIds }, transaction });
        await Question.destroy({ where: { id: qIds }, transaction });
      }
      await CircleMember.destroy({ where: { circleId: cId }, transaction });
      await Circle.destroy({ where: { id: cId }, transaction });
    }

    // 13. Questions, answers, votes
    const qIds = (await Question.findAll({ where: { userId }, attributes: ['id'], transaction })).map((q: any) => q.id);
    if (qIds.length > 0) {
      await QuestionAnswer.destroy({ where: { questionId: qIds }, transaction });
      await QuestionVote.destroy({ where: { questionId: qIds }, transaction });
      await Question.destroy({ where: { id: qIds }, transaction });
    }

    const userAnswers = await QuestionAnswer.findAll({ where: { userId }, attributes: ['questionId'], transaction });
    await QuestionAnswer.destroy({ where: { userId }, transaction });
    for (const ans of userAnswers) {
      const count = await QuestionAnswer.count({ where: { questionId: ans.questionId }, transaction });
      await Question.update({ answerCount: count }, { where: { id: ans.questionId }, transaction });
    }

    await QuestionVote.destroy({ where: { userId }, transaction });

    // 14. Likes, reports, blocks
    await PlaydateLike.destroy({ where: { swiperId: userId }, transaction });
    await OwnerLike.destroy({
      where: {
        [Op.or]: [
          { likerId: userId },
          { targetId: userId }
        ]
      },
      transaction
    });
    await Report.destroy({
      where: {
        [Op.or]: [
          { reporterId: userId },
          { reportedId: userId }
        ]
      },
      transaction
    });
    await UserBlock.destroy({
      where: {
        [Op.or]: [
          { blockerId: userId },
          { blockedId: userId }
        ]
      },
      transaction
    });

    // 15. Notifications, devices, preferences
    await Notification.destroy({ where: { userId }, transaction });
    await NotificationDevice.destroy({ where: { userId }, transaction });
    await NotificationPreference.destroy({ where: { userId }, transaction });

    // Finally delete user
    await user.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "User removed successfully" });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject / remove a vet
// @route   DELETE /api/admin/vets/:vetId
export const deleteVet = async (req: Request, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      vets: Vet,
      vet_reviews: VetReview,
      appointments: Appointment,
      saved_vets: SavedVet,
      posts: Post,
      comments: Comment,
      likes: Like,
      saved_posts: SavedPost,
    } = db as any;

    const vet = await Vet.findByPk(req.params.vetId, { transaction });
    if (!vet) {
      await transaction.rollback();
      res.status(404).json({ message: "Vet not found" });
      return;
    }

    const vetId = vet.id;

    // Clean reviews
    await VetReview.destroy({ where: { vetId }, transaction });

    // Clean appointments
    await Appointment.destroy({ where: { vetId }, transaction });

    // Clean saved_vets
    await SavedVet.destroy({ where: { vetId }, transaction });

    // Clean posts authored by vet
    const postIds = (await Post.findAll({ where: { userId: vetId }, attributes: ['id'], transaction })).map((p: any) => p.id);
    if (postIds.length > 0) {
      await Comment.destroy({ where: { postId: postIds }, transaction });
      await Like.destroy({ where: { postId: postIds }, transaction });
      await SavedPost.destroy({ where: { postId: postIds }, transaction });
      await Post.destroy({ where: { id: postIds }, transaction });
    }

    // Delete the vet itself
    await vet.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "Vet removed successfully" });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ALL community posts (approved + pending)
// @route   GET /api/admin/posts
export const getAllPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { posts: Post, users: User, vets: Vet } = db as any;
    const posts = await Post.findAll({
      include: [
        { model: User, as: 'author', attributes: ['name', 'role', 'avatar_url'] },
        { model: Vet, as: 'vetAuthor', attributes: ['name', 'profession', 'avatar_url'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events with booking counts and booker details
// @route   GET /api/admin/events
export const getAdminEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event, event_bookings: EventBooking, users: User, vets: Vet } = db as any;
    if (!Event) { res.json([]); return; }

    const events = await Event.findAll({ order: [['date', 'ASC']] });

    const enriched = await Promise.all(events.map(async (event: any) => {
      const bookings = await EventBooking.findAll({ where: { eventId: event.id } });

      // Fetch booker profile for each booking
      const bookers = await Promise.all(bookings.map(async (b: any) => {
        const table = b.userType === 'vet' ? Vet : User;
        const profile = await table.findByPk(b.userId, {
          attributes: ['id', 'name', 'email', 'phone'],
        });
        return profile ? {
          id: b.id,
          userId: b.userId,
          userType: b.userType,
          name: profile.name,
          email: profile.email,
          phone: profile.phone || null,
          note: b.note || null,
          bookedAt: b.createdAt,
        } : null;
      }));

      return {
        ...event.toJSON(),
        attendeeCount: bookings.length,
        bookers: bookers.filter(Boolean),
      };
    }));

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an event
// @route   POST /api/admin/events
export const createAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event, users: User, vets: Vet } = db as any;
    const { title, description, date, time, location, category, imageUrl } = req.body;
    const event = await Event.create({ title, description, date, time, location, category, imageUrl, organizerId: (req as any).user?.id });
    res.status(201).json(event);

    // Notify all users and vets about the new event (fire and forget)
    (async () => {
      try {
        const [users, vets] = await Promise.all([
          User.findAll({ attributes: ['id'] }),
          Vet.findAll({ attributes: ['id'] }),
        ]);
        const actors = [
          ...(users as any[]).map((u: any) => ({ actorId: u.id, actorType: 'user' as const })),
          ...(vets as any[]).map((v: any) => ({ actorId: v.id, actorType: 'vet' as const })),
        ];
        await Promise.allSettled(actors.map((actor) =>
          createRichNotification({
            actorId: actor.actorId,
            actorType: actor.actorType,
            type: 'event',
            category: 'activity',
            title: `New Event: ${title}`,
            message: `${location ? location + ' · ' : ''}${date || ''}`,
            relatedId: event.id,
            relatedType: 'event',
            actionType: 'event_detail',
            actionPayload: { eventId: event.id },
            sendPush: true,
          })
        ));
      } catch (err) {
        console.error('Event notification broadcast failed:', err);
      }
    })();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PATCH /api/admin/events/:eventId
export const updateAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event } = db as any;
    const event = await Event.findByPk(req.params.eventId);
    if (!event) { res.status(404).json({ message: "Event not found" }); return; }
    const { title, description, date, time, location, category, imageUrl, status } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (location !== undefined) event.location = location;
    if (category !== undefined) event.category = category;
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (status !== undefined) event.status = status;
    await event.save();
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event (and its bookings to satisfy FK constraint)
// @route   DELETE /api/admin/events/:eventId
export const deleteAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { events: Event, event_bookings: EventBooking } = db as any;
    const event = await Event.findByPk(req.params.eventId);
    if (!event) { res.status(404).json({ message: "Event not found" }); return; }
    await EventBooking.destroy({ where: { eventId: req.params.eventId } });
    await event.destroy();
    res.json({ message: "Event deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pets open for adoption
// @route   GET /api/admin/adoptions
export const getAdoptionPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { pets: Pet, users: User } = db as any;
    const pets = await Pet.findAll({
      where: { isAdoptionOpen: true },
      include: [{ model: User, as: 'owner', attributes: ['name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(pets);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a pet
// @route   DELETE /api/admin/pets/:petId
export const deletePet = async (req: Request, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      pets: Pet,
      vaccines: Vaccine,
      medical_records: MedicalRecord,
      medications: Medication,
      allergies: Allergy,
      appointments: Appointment,
      reminders: Reminder,
      vitals: Vital,
      adoption_applications: AdoptionApplication,
      conversations: Conversation,
      messages: Message,
      playdate_likes: PlaydateLike,
    } = db as any;

    const pet = await Pet.findByPk(req.params.petId, { transaction });
    if (!pet) {
      await transaction.rollback();
      res.status(404).json({ message: "Pet not found" });
      return;
    }

    const petId = pet.id;

    // Delete all related records
    await Vaccine.destroy({ where: { petId }, transaction });
    await MedicalRecord.destroy({ where: { petId }, transaction });
    await Medication.destroy({ where: { petId }, transaction });
    await Allergy.destroy({ where: { petId }, transaction });
    await Appointment.destroy({ where: { petId }, transaction });
    await Reminder.destroy({ where: { petId }, transaction });
    await Vital.destroy({ where: { petId }, transaction });
    await AdoptionApplication.destroy({ where: { petId }, transaction });
    await Message.destroy({ where: { petId }, transaction });
    await Conversation.destroy({ where: { petId }, transaction });
    await PlaydateLike.destroy({
      where: {
        [Op.or]: [
          { swiperPetId: petId },
          { targetPetId: petId }
        ]
      },
      transaction
    });

    // Finally delete the pet
    await pet.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "Pet removed successfully" });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin approve/reject adoption application
// @route   PATCH /api/admin/adoptions/:id/status
export const adminReviewApplication = async (req: Request, res: Response): Promise<void> => {
  try {
    const { adoption_applications: Application } = db as any;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
      return;
    }
    const application = await Application.findByPk(req.params.id);
    if (!application) { res.status(404).json({ message: "Application not found" }); return; }
    application.status = status;
    await application.save();
    res.json(application);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all appointments across the platform
// @route   GET /api/admin/appointments
export const getAllAppointments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { appointments: Appointment, users: User, vets: Vet, pets: Pet } = db as any;
    const appointments = await Appointment.findAll({
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: Vet, as: 'veterinarian', attributes: ['id', 'name', 'hospital_name'] },
        { model: Pet, as: 'pet', attributes: ['id', 'name', 'species'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(appointments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vet reviews
// @route   GET /api/admin/vet-reviews
export const getAllVetReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { vet_reviews: VetReview, users: User, vets: Vet } = db as any;
    const reviews = await VetReview.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Vet, as: 'vet', attributes: ['id', 'name', 'hospital_name'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reviews);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a vet review and recalculate vet rating
// @route   DELETE /api/admin/vet-reviews/:reviewId
export const adminDeleteVetReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vet_reviews: VetReview, vets: Vet } = db as any;
    const review = await VetReview.findByPk(req.params.reviewId);
    if (!review) { res.status(404).json({ message: "Review not found" }); return; }
    const vetId = review.vetId;
    await review.destroy();
    const allReviews = await VetReview.findAll({ where: { vetId } });
    const vet = await Vet.findByPk(vetId);
    if (vet) {
      vet.rating = allReviews.length > 0
        ? Math.round((allReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / allReviews.length) * 10) / 10
        : 0;
      await vet.save();
    }
    res.json({ message: "Review removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all questions with author + circle + answer count
// @route   GET /api/admin/questions
export const getAllQuestions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { questions: Question, question_answers: QuestionAnswer, users: User, circles: Circle } = db as any;
    const questions = await Question.findAll({
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'username', 'avatar_url'], required: false },
        { model: Circle, as: 'circle', attributes: ['id', 'name'], required: false },
        { model: QuestionAnswer, as: 'answers', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(questions.map((q: any) => ({
      ...q.toJSON(),
      answerCount: (q.answers || []).length,
    })));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a question as admin
// @route   POST /api/admin/questions
export const adminCreateQuestion = async (req: any, res: Response): Promise<void> => {
  try {
    const { questions: Question, users: User } = db as any;
    const { title, body, tags, circleId } = req.body;
    if (!String(title || '').trim()) { res.status(400).json({ message: 'Title is required' }); return; }

    const question = await Question.create({
      userId: req.user.id,
      circleId: circleId || null,
      title: String(title).trim(),
      body: body ? String(body).trim() : null,
      tags: Array.isArray(tags) ? tags : [],
      upvotes: 0,
      answerCount: 0,
    });

    const author = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'username', 'avatar_url'] });
    res.status(201).json({ ...question.toJSON(), author, answerCount: 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a question (and its answers)
// @route   DELETE /api/admin/questions/:id
export const adminDeleteQuestion = async (req: Request, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      questions: Question,
      question_answers: QuestionAnswer,
      question_votes: QuestionVote,
    } = db as any;

    const question = await Question.findByPk(req.params.id, { transaction });
    if (!question) {
      await transaction.rollback();
      res.status(404).json({ message: 'Question not found' });
      return;
    }

    const questionId = question.id;

    // Delete answers and votes
    await QuestionAnswer.destroy({ where: { questionId }, transaction });
    await QuestionVote.destroy({ where: { questionId }, transaction });

    await question.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get answers for a question
// @route   GET /api/admin/questions/:id/answers
export const adminGetAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question_answers: QuestionAnswer, users: User } = db as any;
    const answers = await QuestionAnswer.findAll({
      where: { questionId: req.params.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username', 'avatar_url'], required: false }],
      order: [['createdAt', 'ASC']],
    });
    res.json(answers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an answer
// @route   DELETE /api/admin/questions/:id/answers/:answerId
export const adminDeleteAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question_answers: QuestionAnswer, questions: Question } = db as any;
    const answer = await QuestionAnswer.findByPk(req.params.answerId);
    if (!answer) { res.status(404).json({ message: 'Answer not found' }); return; }
    await answer.destroy();
    await Question.decrement('answerCount', { where: { id: req.params.id }, by: 1 });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all circles
// @route   GET /api/admin/circles
export const getAllCircles = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { circles: Circle, users: User } = db as any;
    const circles = await Circle.findAll({
      include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'username', 'avatar_url'] }],
      order: [['memberCount', 'DESC'], ['createdAt', 'DESC']],
    });
    res.json(circles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a circle as admin
// @route   POST /api/admin/circles
export const adminCreateCircle = async (req: any, res: Response): Promise<void> => {
  try {
    const { circles: Circle, circle_members: CircleMember } = db as any;
    const { name, description, category, coverImage } = req.body;
    if (!String(name || '').trim()) { res.status(400).json({ message: 'Circle name is required' }); return; }

    const circle = await Circle.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      category: category || 'general',
      coverImage: coverImage || null,
      createdBy: req.user.id,
      memberCount: 1,
      isPublic: true,
    });

    await CircleMember.create({ circleId: circle.id, userId: req.user.id, role: 'admin' });

    const { users: User } = db as any;
    const creator = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'username', 'avatar_url'] });
    res.status(201).json({ ...circle.toJSON(), creator, isJoined: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a circle
// @route   DELETE /api/admin/circles/:id
export const adminDeleteCircle = async (req: Request, res: Response): Promise<void> => {
  const transaction = await db.sequelize.transaction();
  try {
    const {
      circles: Circle,
      circle_members: CircleMember,
      questions: Question,
      question_answers: QuestionAnswer,
      question_votes: QuestionVote,
    } = db as any;

    const circle = await Circle.findByPk(req.params.id, { transaction });
    if (!circle) {
      await transaction.rollback();
      res.status(404).json({ message: 'Circle not found' });
      return;
    }

    const circleId = circle.id;

    // Delete all questions in this circle (along with answers and votes)
    const qIds = (await Question.findAll({ where: { circleId }, attributes: ['id'], transaction })).map((q: any) => q.id);
    if (qIds.length > 0) {
      await QuestionAnswer.destroy({ where: { questionId: qIds }, transaction });
      await QuestionVote.destroy({ where: { questionId: qIds }, transaction });
      await Question.destroy({ where: { id: qIds }, transaction });
    }

    // Delete circle members
    await CircleMember.destroy({ where: { circleId }, transaction });

    // Delete circle
    await circle.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true, message: 'Circle deleted' });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all lost pet reports
// @route   GET /api/admin/lost-pets
export const getAllLostPets = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet, users: User } = db as any;
    const list = await LostPet.findAll({
      include: [{ model: User, as: 'author', attributes: ['id', 'name', 'username', 'avatar_url'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lost pet status (admin can also mark as found)
// @route   PATCH /api/admin/lost-pets/:id/status
export const adminUpdateLostPetStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const { status } = req.body;
    if (!['lost', 'spotted', 'found'].includes(status)) {
      res.status(400).json({ message: "Status must be 'lost', 'spotted', or 'found'" });
      return;
    }
    const pet = await LostPet.findByPk(req.params.id);
    if (!pet) { res.status(404).json({ message: 'Report not found' }); return; }
    pet.status = status;
    await pet.save();
    res.json(pet);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a lost pet report
// @route   DELETE /api/admin/lost-pets/:id
export const adminDeleteLostPet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lost_pets: LostPet } = db as any;
    const pet = await LostPet.findByPk(req.params.id);
    if (!pet) { res.status(404).json({ message: 'Report not found' }); return; }
    await pet.destroy();
    res.json({ success: true, message: 'Report deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get platform stats overview
// @route   GET /api/admin/stats
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const {
      posts: Post,
      users: User,
      pets: Pet,
      vets: Vet,
      appointments: Appointment,
      contact_leads: ContactLead,
    } = db as any;
    const [
      totalUsers,
      totalVets,
      totalPets,
      totalPosts,
      pendingPosts,
      pendingVets,
      totalAppointments,
      totalContactLeads,
      newContactLeads,
    ] = await Promise.all([
      User.count(),
      Vet.count(),
      Pet.count(),
      Post ? Post.count({ where: { status: 'approved' } }) : Promise.resolve(0),
      Post ? Post.count({ where: { status: 'pending' } }) : Promise.resolve(0),
      Vet.count({ where: { isVerified: false } }),
      Appointment ? Appointment.count() : Promise.resolve(0),
      ContactLead ? ContactLead.count() : Promise.resolve(0),
      ContactLead ? ContactLead.count({ where: { status: 'new' } }) : Promise.resolve(0),
    ]);

    res.json({
      totalUsers,
      totalVets,
      totalPets,
      totalPosts,
      pendingPosts,
      pendingVets,
      totalAppointments,
      totalContactLeads,
      newContactLeads,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// Reports / Moderation
// ─────────────────────────────────────────────

// @desc    Get all user reports (with reporter + reported user)
// @route   GET /api/admin/reports
export const getAllReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const { reports: Report, users: User } = db as any;
    const reports = await Report.findAll({
      include: [
        { model: User, as: "reporter", attributes: ["id", "name", "email", "username", "avatar_url"] },
        { model: User, as: "reported", attributes: ["id", "name", "email", "username", "avatar_url", "role"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a report's moderation status
// @route   PATCH /api/admin/reports/:id/status
export const updateReportStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reports: Report } = db as any;
    const { status } = req.body as { status?: string };
    const allowed = ["pending", "resolved", "dismissed"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ message: "Invalid status. Use pending, resolved or dismissed." });
      return;
    }
    const report = await Report.findByPk(req.params.id);
    if (!report) { res.status(404).json({ message: "Report not found" }); return; }
    report.status = status;
    await report.save();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a report
// @route   DELETE /api/admin/reports/:id
export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reports: Report } = db as any;
    const report = await Report.findByPk(req.params.id);
    if (!report) { res.status(404).json({ message: "Report not found" }); return; }
    await report.destroy();
    res.json({ message: "Report removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
