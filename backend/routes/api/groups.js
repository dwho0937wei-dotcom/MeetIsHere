const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Group, Membership, GroupImage, Sequelize, Venue, Event, Attendance, EventImage } = require('../../db/models');
const { userLoggedIn, requireAuth2, requireProperAuth } = require('../../utils/auth');

const router = express.Router();

const getUserFromToken = function (req) {
    const { token } = req.cookies;
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = decodeToken.data;
    return user;
} 

// Create a new venue for a group specified by its id
router.post('/:groupId/venues', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }

    const coHost = await Membership.findOne({
        where: {userId: user.id, groupId, status: 'co-host'}
    });
    if (group.dataValues.organizerId !== user.id && !coHost) {
        return requireProperAuth(res);
    }

    const { address, city, state, lat, lng } = req.body;
    try {
        let newVenue = await group.createVenue({
            address, city, state, lat, lng
        });
        newVenue = newVenue.toJSON();
        delete newVenue.updatedAt;
        delete newVenue.createdAt;
        res.status(200);
        res.json(newVenue);
    } catch (error) {
        res.status(400);
        res.json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
                "address": "Street address is required",
                "city": "City is required",
                "state": "State is required",
                "lat": "Latitude must be within -90 and 90",
                "lng": "Longitude must be within -180 and 180",
            }
        })
    }
})

// Get all venues for a group specified by its id
router.get('/:groupId/venues', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }

    const coHost = await Membership.findOne({
        where: {userId: user.id, groupId, status: 'co-host'}
    });
    if (group.dataValues.organizerId !== user.id && !coHost) {
        return requireProperAuth(res);
    }

    const venues = await group.getVenues();
    res.status(200);
    res.json({Venues: venues})
})

// Add an image to a group specified by its id
router.post('/:groupId/images', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }
    if (group.dataValues.organizerId !== user.id) {
        return requireProperAuth(res);
    }

    const { url, preview } = req.body;
    let newImage = await group.createGroupImage({ url, preview });
    newImage = newImage.toJSON();
    delete newImage.groupId;
    delete newImage.updatedAt;
    delete newImage.createdAt;
    res.status(200);
    res.json(newImage);
})

// Get all members of a group specified by its id
router.get('/:groupId/members', async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        res.json({
            message: "Group couldn't be found"
        })
    }

    let user;
    let isOrganizer = false;
    if (userLoggedIn(req)) {
        user = getUserFromToken(req);
        if (user.id === group.dataValues.organizerId) {
            isOrganizer = true;
        }
    }

    const members = await group.getUsers({
        attributes: ['id', 'firstName', 'lastName']
    });

    res.status(200);
    res.json({ Members: members });
})

// Create an event for a group specified by its id
router.post('/:groupId/events', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);

    const groupId = +req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }

    const coHost = await Membership.findOne({
        where: {userId: user.id, groupId, status: 'co-host'}
    });
    if (group.dataValues.organizerId !== user.id && !coHost) {
        return requireProperAuth(res);
    }

    const { venueId, name, type, capacity, price, description, startDate, endDate } = req.body;
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
        res.status(404);
        return res.json({
            message: "Venue couldn't be found"
        })
    }

    try {
        const newEvent = await Event.create({
            venueId, groupId, name, type, capacity, price, description, startDate, endDate
        });
        const newEventJson = newEvent.toJSON();
        delete newEventJson.createdAt;
        delete newEventJson.updatedAt;
        res.status(200);
        res.json(newEventJson);
    } catch (error) {
        console.log(error);

        res.status(400);
        res.json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
                "name": "Name must be at least 5 characters",
                "type": "Type must be Online or In person",
                "capacity": "Capacity must be an integer",
                "price": "Price is invalid",
                "description": "Description is required",
                "startDate": "Start date must be in the future",
                "endDate": "End date is less than start date",
            }
        })
    }
})

// Get all groups joined or organized by the current user
router.get('/current', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);

    const groups = await Group.findAll({
        include: [
            {
                model: Membership,
                attributes: []
            },
            {
                model: GroupImage,
                required: false,
                where: { preview: true },
                attributes: []
            }
        ],
        attributes: {
            include: [[Sequelize.fn("COUNT", Sequelize.col("Memberships.id")), "numMembers"], 
                      [Sequelize.literal(`COALESCE(GroupImages.url, '')`), 'previewImage']]
        },
        where: { 
            [Op.or]: [
               { organizerId: user.id },
               Sequelize.literal(`EXISTS (SELECT 1 FROM Memberships WHERE Memberships.groupId = id AND Memberships.userId = ${user.id})`)
            ]
        },
        group: ['Group.id', 'GroupImages.id', 'Memberships.id']
    });
    return res.json({Groups: groups});
})

// Get all events of a group specified by its id
router.get('/:groupId/events', async (req, res) => {
    const groupId = req.params.groupId;

    const events = await Event.findAll({
        where: { groupId },
        include: [
            {
                model: Attendance,
                attributes: []
            },
            {
                model: Venue,
                attributes: ['id', 'city', 'state']
            },
            {
                model: EventImage,
                where: {preview: true},
                attributes: [],
            },
            {
                model: Group,
                attributes: ['id', 'name', 'city', 'state']
            }
        ],
        attributes: {
            include: [[Sequelize.fn("COUNT", Sequelize.col("Attendances.id")), "numAttending"],     
                      [Sequelize.fn("", Sequelize.col("EventImages.url")), "previewImage"]]
        },
        group: [
            'Event.id',
            'Venue.id',
            'Group.id',
            'EventImages.id',
            'Attendances.id'
        ]
    });
    res.status(200);
    res.json({Events: events});
})

// Edit a group
router.put('/:groupId', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = await getUserFromToken(req);

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }
    if (group.dataValues.organizerId !== user.id) {
        return requireProperAuth(res);
    }

    const { name, about, type, private, city, state } = req.body;
    try {
        await group.set({
            name, about, type, private, city, state
        });
        await group.save();
        res.status(200);
        res.json(group);
    } catch (error) {
        res.status(400);
        res.json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
                "name": "Name must be 60 characters or less",
                "about": "About must be 50 characters or more",
                "type": "Type must be 'Online' or 'In person'",
                "private": "Private must be a boolean",
                "city": "City is required",
                "state": "State is required",
            }
        });
    }
})

// Get details from a group specified by its id
router.get('/:groupId', async (req, res) => {
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
    if (!group) {
        res.status(404);
        res.json({
            message: "Group couldn't be found"
        })
    }

    let organizer = await User.findByPk(group.organizerId, {
        attributes: ['id', 'firstName', 'lastName']
    });
    organizer = organizer.toJSON();
    group.dataValues.Organizer = organizer;
    res.status(200);
    res.json(group);
})

// Delete the group specified by its id
router.delete('/:groupId', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }

    const user = await getUserFromToken(req);

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }
    if (group.dataValues.organizerId !== user.id) {
        return requireProperAuth(res);
    }

    await group.destroy();
    res.status(200);
    res.json({
        message: "Successfully deleted"
    });
})

// Create a group
router.post('/', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const user = getUserFromToken(req);
    const { name, about, type, private, city, state } = req.body;

    try {
        const newGroup = await Group.create({
            name, about, type, private, city, state,
            organizerId: user.id
        });
        res.status(201);
        res.json(newGroup);
    } catch (error) {
        res.status(400);
        res.json({
            "message": "Bad Request", // (or "Validation error" if generated by Sequelize),
            "errors": {
                "name": "Name must be 60 characters or less",
                "about": "About must be 50 characters or more",
                "type": "Type must be 'Online' or 'In person'",
                "private": "Private must be a boolean",
                "city": "City is required",
                "state": "State is required"
            }
        });
    }
})

// Get all groups
router.get('/', async (req, res) => {
    const groups = await Group.findAll(
        {
            include: [
                {
                    model: Membership,
                    attributes: []
                },
                {
                    model: GroupImage,
                    required: false,
                    where: { preview: true },
                    attributes: []
                }
            ],
            attributes: {
                include: [[Sequelize.fn("COUNT", Sequelize.col("Memberships.id")), "numMembers"], 
                [Sequelize.literal(`COALESCE(GroupImages.url, '')`), 'previewImage']]
            },
            group: ['Group.id', 'GroupImages.id', 'Memberships.id']
        }
    );
    res.json({Groups: groups});
})

module.exports = router;