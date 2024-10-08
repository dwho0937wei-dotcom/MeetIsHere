const express = require('express');
const { Op } = require('sequelize');

const { User, Group, Membership, GroupImage, Sequelize, Venue, Event, Attendance, EventImage } = require('../../db/models');
const { userLoggedIn, restoreUser, requireAuth2, hostOfGroup, hostOrCohostOfGroup, requireProperAuth} = require('../../utils/auth');
const { getUserFromToken, groupExists, venueExists, userExists } = require('../../utils/helper');
const { validateGroup, validateVenue, validateEvent } = require('../../utils/validation');

const router = express.Router();

// Delete a membership to a group specified by id
router.delete('/:groupId/membership/:memberId', restoreUser, requireAuth2, groupExists, userExists, async (req, res) => {
    const user = getUserFromToken(req);

    const groupId = +req.params.groupId;
    const group = await Group.findByPk(groupId);

    const memberId = +req.params.memberId;
    const membershipToDelete = await Membership.findOne(
        { where: { userId: memberId } }
    );
    if (!membershipToDelete) {
        res.status(404);
        return res.json({
            message: "Membership does not exist for this User"
        });
    }

    if (group.organizerId !== user.id && memberId !== user.id) {
        return requireProperAuth(res);
    }

    res.status(200);
    await membershipToDelete.destroy();
    res.json({
        message: "Successfully deleted membership from group"
    });
})

// Create a new venue for a group specified by its id
router.post('/:groupId/venues', restoreUser, requireAuth2, validateVenue, groupExists, hostOrCohostOfGroup, async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    const { address, city, state, lat, lng } = req.body;
    let newVenue = await group.createVenue({
        address, city, state, lat, lng
    });
    newVenue = newVenue.toJSON();
    delete newVenue.updatedAt;
    delete newVenue.createdAt;
    res.status(200);
    res.json(newVenue);
})

// Get all venues for a group specified by its id
router.get('/:groupId/venues', restoreUser, requireAuth2, groupExists, hostOrCohostOfGroup, async (req, res) => {
    const group = await Group.findByPk(req.params.groupId);
    const venues = await group.getVenues();
    res.status(200);
    res.json({Venues: venues})
})

// Change the status of a membership for a group specified by its id
router.put('/:groupId/membership', restoreUser, requireAuth2, groupExists, userExists, async (req, res) => {
    const user = getUserFromToken(req);

    const { memberId, status } = req.body;

    const membershipToUpdate = await Membership.findOne(
        { where: { userId: memberId } }
    );
    if (!membershipToUpdate) {
        return res.status(404).json({
            message: "Membership between the user and the group does not exist"
        });
    }

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (status === 'pending') {
        return res.status(400).json({
            message: "Bad Request",
            errors: {
                status: "Cannot change a membership status to pending"
            }
        })
    }
    else if (status === 'member') {
        const coHost = await Membership.findOne({
            where: {userId: user.id, groupId, status: 'co-host'}
        });
        if (group.dataValues.organizerId !== user.id && !coHost) {
            return requireProperAuth(res);
        }
    }
    else if (status === 'co-host') {
        if (group.dataValues.organizerId !== user.id) {
            return requireProperAuth(res);
        }
    }

    if (status === 'member' || status === 'co-host') {
        await membershipToUpdate.set({ status }).save();
    }
    return res.status(200).json({
        id: membershipToUpdate.id,
        memberId: membershipToUpdate.userId,
        groupId: membershipToUpdate.groupId,
        status: membershipToUpdate.status
    });
})

// Request a membership for a group specified by its id
router.post('/:groupId/membership', restoreUser, requireAuth2, groupExists, async (req, res) => {
    const user = getUserFromToken(req);

    const groupId = req.params.groupId;
    const sameMember = await Membership.findOne({
        where: {
            userId: user.id,
            groupId
        }
    });
    if (sameMember) {
        res.status(400);
        const status = sameMember.dataValues.status;
        if (status === 'pending') {
            return res.json({
                message: "Membership has already been requested"
            })
        }
        else {
            return res.json({
                message: "User is already a member of the group"
            })
        }
    }

    res.status(200);
    const group = await Group.findByPk(groupId);
    const newMember = await group.addMember(user.id, { through: { status:'pending' } });
    const payload = {
        memberId: newMember[0].dataValues.userId,
        status: newMember[0].dataValues.status
    };
    return res.json(payload);
})

// Get all members of a group specified by its id
router.get('/:groupId/members', groupExists, async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);

    let user;
    let isOrganizer = false;
    let isCoHost = false;
    if (userLoggedIn(req)) {
        user = getUserFromToken(req);
        if (user.id === group.dataValues.organizerId) {
            isOrganizer = true;
        }
        const sameCoHost = await Membership.findOne({
            where: { groupId, userId: user.id, status: 'co-host' },
        });
        if (sameCoHost) {
            isCoHost = true;
        }
    }

    let memberCriteria = {
        attributes: ['id', 'firstName', 'lastName'],
        joinTableAttributes: ['status']
    };

    if (!isOrganizer && !isCoHost) {
        memberCriteria.where = 
        {
            '$Membership.status$': {
                [Op.notIn]: ['pending']
            }
        }
    }
    const members = await group.getMember(memberCriteria);

    res.status(200);
    res.json({ Members: members });
})

// Add an image to a group specified by its id
router.post('/:groupId/images', restoreUser, requireAuth2, groupExists, hostOfGroup, async (req, res) => {
    // Find group
    const group = await Group.findByPk(req.params.groupId);
    const { url, preview } = req.body;
    // Create and add image for group
    let newImage = await group.createGroupImage({ url, preview });
    newImage = newImage.toJSON();
    // Get rid of unnecessary extra details
    delete newImage.groupId;
    delete newImage.updatedAt;
    delete newImage.createdAt;
    // JSON response
    return res.status(200).json(newImage);
})

// Create an event for a group specified by its id
// router.post('/:groupId/events', restoreUser, requireAuth2, validateEvent, groupExists, venueExists, hostOrCohostOfGroup, async (req, res) => {
router.post('/:groupId/events', restoreUser, requireAuth2, validateEvent, groupExists, hostOrCohostOfGroup, async (req, res) => {
    // Identify current user
    const user = getUserFromToken(req);

    // Get groupId
    const groupId = +req.params.groupId;

    // Get the req.body
    const { venueId, name, type, capacity, price, description, startDate, endDate } = req.body;

    // Create an event
    console.log(price);
    const newEvent = await Event.create({
        venueId, groupId, name, type, capacity, price, description, startDate, endDate
    });

    // Current user becomes the host of the event
    await Attendance.create({
        eventId: newEvent.dataValues.id,
        userId: user.id,
        status: 'host'
    });

    // Create and respond with the proper JSON for the new event
    const newEventJson = newEvent.toJSON();
    delete newEventJson.createdAt;
    delete newEventJson.updatedAt;
    res.status(200);
    res.json(newEventJson);
})

// Get all groups joined or organized by the current user
router.get('/current', restoreUser, requireAuth2, async (req, res) => {
    // Finding user
    const user = getUserFromToken(req);
    const findUser = await User.findByPk(user.id);

    // Getting the groups that the current user is part of
    const groups = await findUser.getJoinedGroup({
        include: [
            {
                model: GroupImage,
                required: false,
                where: { preview: true },
                attributes: []
            }
        ],
    });

    // Aggregate using JavaScript
    for (const group of groups) {
        // Counting member in each group
        const numMembers = await group.countMember();
        group.dataValues.numMembers = numMembers;

        // Getting the group's preview image
        const previewImage = await GroupImage.findOne({
            where: {
                groupId: group.dataValues.id,
                preview: true,
            }
        })
        if (previewImage) {
            group.dataValues.previewImage = previewImage.dataValues.url;
        }
        else {
            group.dataValues.previewImage = null;
        }

        // Deleting unneeded membership details
        delete group.dataValues.Membership;

        // Changing the date format of both createdAt & updatedAt
        // from "(year-month-day)T(hour:minute:second).000Z"
        // to "(year-month-day) (hour:minute:second)"
        let { createdAt, updatedAt } = group.dataValues;
        const changedDateFormats = [createdAt, updatedAt].map(date => {
            date = date.toISOString().split('T');
            date[1] = date[1].split('.')[0];
            date = date.join(' ');
            return date;
        })
        group.dataValues.createdAt = changedDateFormats[0];
        group.dataValues.updatedAt = changedDateFormats[1];
    }

    return res.json({Groups: groups});
})

// Get all events of a group specified by its id
router.get('/:groupId/events', groupExists, async (req, res) => {
    const groupId = req.params.groupId;

    // Find all events related to the specified group
    const events = await Event.findAll({
        where: { groupId },
        include: [
            {
                model: Venue,
                attributes: ['id', 'city', 'state']
            },
            {
                model: Group,
                attributes: ['id', 'name', 'city', 'state']
            }
        ],
        attributes: [
            "id",
            "groupId",
            "venueId",
            "name",
            "type",
            "description",
            "startDate",
            "endDate"
        ]
    });

    // Aggregate using JavaScript instead
    for (const event of events) {
        // For counting number of attendance in each event
        const numAttending = await event.countAttendee();
        event.dataValues.numAttending = numAttending;

        // And extracting each event's preview image
        const eventId = event.dataValues.id;
        const previewImage = await EventImage.findOne({
            where: { 
                eventId,
                preview: true,
            }
        });
        if (previewImage) {
            event.dataValues.previewImage = previewImage.dataValues.url;
        }
        else {
            event.dataValues.previewImage = null;
        }

        // Changing the date format of both startDate and endDate
        // from "(year-month-day)T(hour:minute:second).000Z"
        // to "(year-month-day) (hour:minute:second)"
        let { startDate: eventStartDate, endDate: eventEndDate } = event.dataValues;
        const changedDateFormats = [eventStartDate, eventEndDate].map(date => {
            date = date.toISOString().split('T');
            date[1] = date[1].split('.')[0];
            date = date.join(' ');
            return date;
        })
        event.dataValues.startDate = changedDateFormats[0];
        event.dataValues.endDate = changedDateFormats[1];
    }

    return res.status(200).json({Events: events});
})

// Edit a group
router.put('/:groupId', restoreUser, requireAuth2, validateGroup, groupExists, hostOfGroup, async (req, res) => {
    const group = await Group.findByPk(req.params.groupId);
    const { name, about, type, private, city, state } = req.body;
    await group.set({ name, about, type, private, city, state }).save();

    // Changing the date format of both createdAt & updatedAt
    // from "(year-month-day)T(hour:minute:second).000Z"
    // to "(year-month-day) (hour:minute:second)"
    let { createdAt, updatedAt } = group.dataValues;
    const changedDateFormats = [createdAt, updatedAt].map(date => {
        date = date.toISOString().split('T');
        date[1] = date[1].split('.')[0];
        date = date.join(' ');
        return date;
    })
    group.dataValues.createdAt = changedDateFormats[0];
    group.dataValues.updatedAt = changedDateFormats[1];

    return res.status(200).json(group);
})

// Get details from a group specified by its id
router.get('/:groupId', groupExists, async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
        include: [
            {
                model: GroupImage,
                attributes: ['id', 'url', 'preview']
            },
            {
                model: Venue,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }
        ]
    })

    const numMembers = await group.countMember();
    group.dataValues.numMembers = numMembers;

    let organizer = await User.findByPk(group.organizerId, {
        attributes: ['id', 'firstName', 'lastName']
    });
    organizer = organizer.toJSON();
    group.dataValues.Organizer = organizer;

    // Changing the date format of both createdAt & updatedAt
    // from "(year-month-day)T(hour:minute:second).000Z"
    // to "(year-month-day) (hour:minute:second)"
    let { createdAt, updatedAt } = group.dataValues;
    const changedDateFormats = [createdAt, updatedAt].map(date => {
        date = date.toISOString().split('T');
        date[1] = date[1].split('.')[0];
        date = date.join(' ');
        return date;
    })
    group.dataValues.createdAt = changedDateFormats[0];
    group.dataValues.updatedAt = changedDateFormats[1];

    return res.status(200).json(group);
})

// Delete the group specified by its id
router.delete('/:groupId', restoreUser, requireAuth2, groupExists, hostOfGroup, async (req, res) => {
    const group = await Group.findByPk(req.params.groupId);
    await group.destroy();
    return res.status(200).json({
        message: "Successfully deleted"
    });
})

// Create a group
router.post('/', restoreUser, requireAuth2, validateGroup, async (req, res) => {
    // User creates Group
    const user = getUserFromToken(req);
    console.log("User Id is:", user.id);
    const { name, about, type, private, city, state } = req.body;
    const newGroup = await Group.create({
        name, about, type, private, city, state,
        organizerId: user.id
    });

    // User becomes the host of its created Group
    Membership.create({
        userId: user.id,
        groupId: newGroup.dataValues.id,
        status: "host"
    })

    // Changing the date format of both createdAt & updatedAt
    // from "(year-month-day)T(hour:minute:second).000Z"
    // to "(year-month-day) (hour:minute:second)"
    let { createdAt, updatedAt } = newGroup.dataValues;
    const changedDateFormats = [createdAt, updatedAt].map(date => {
        date = date.toISOString().split('T');
        date[1] = date[1].split('.')[0];
        date = date.join(' ');
        return date;
    })
    newGroup.dataValues.createdAt = changedDateFormats[0];
    newGroup.dataValues.updatedAt = changedDateFormats[1];
    
    return res.status(201).json(newGroup);
})

// Get all groups
router.get('/', async (req, res) => {
    const groups = await Group.findAll(
        {
            attributes: [
                'id',
                'organizerId',
                'name',
                'about',
                'type',
                'private',
                'city',
                'state',
                'createdAt',
                'updatedAt',
            ]
        }
    );

    // Iterating through each group
    for (const group of groups) {
        // Count the number of members in group
        const numMembers = await group.countMember();
        group.dataValues.numMembers = numMembers;

        // Count the number of events that the group hosted
        const numEvents = await group.countEvents();
        group.dataValues.numEvents = numEvents;

        // Get the group's preview image 
        const previewImage = await group.getGroupImages({
            where: { preview: true }
        });
        if (previewImage.length > 0) {
            group.dataValues.previewImage = previewImage[0].dataValues.url;
        }
        else {
            group.dataValues.previewImage = null;
        }

        // Changing the date format of both createdAt & updatedAt
        // from "(year-month-day)T(hour:minute:second).000Z"
        // to "(year-month-day) (hour:minute:second)"
        let { createdAt, updatedAt } = group.dataValues;
        const changedDateFormats = [createdAt, updatedAt].map(date => {
            date = date.toISOString().split('T');
            date[1] = date[1].split('.')[0];
            date = date.join(' ');
            return date;
        })
        group.dataValues.createdAt = changedDateFormats[0];
        group.dataValues.updatedAt = changedDateFormats[1];
    }

    res.json({Groups: groups});
})

module.exports = router;