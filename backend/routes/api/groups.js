const express = require('express');
const jwt = require('jsonwebtoken');

const { Group, Member, Image, User, Venue } = require('../../db/models');

const router = express.Router();

const groupValidateError = {
    message: "Bad Request", // (or "Validation error" if generated by Sequelize),
    errors: {
        name: "Name must be 60 characters or less",
        about: "About must be 50 characters or more",
        type: "Type must be 'Online' or 'In person'",
        private: "Private must be a boolean",
        city: "City is required",
        state: "State is required",
    }
};

// Add an Image to a Group based on the Group's id
router.post('/:groupId/images', async (req, res) => {
    const { url, preview } = req.body;
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId);
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        });
    }

    const newImage = await Image.create({
        url,
        preview,
        groupId
    })
    const payload = {
        id: newImage.id,
        url: newImage.url,
        preview: newImage.preview
    }
    res.status(200);
    return res.json(payload);
})

// Get details of a Group from an id
router.get('/:groupId/details', async (req, res) => {
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
        include: [
            {
                model: Image,
                attributes: ['id', 'url', 'preview']
            },
            {
                model: User,
                attributes: ['id', 'firstName', 'lastName'],
                through: {
                    model: Member,
                    where: { status: 'organizer' }
                }
            },
            {
                model: Venue,
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            }
        ]
    });
    // console.log(group);

    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        })
    }

    const groupJson = group.toJSON();
    groupJson.GroupImages = groupJson.Images;
    delete groupJson.Images;
    groupJson.Organizer = groupJson.Users[0];
    delete groupJson.Users;
    groupJson.organizerId = groupJson.Organizer.id;
    // console.log('organizerId:', groupJson.organizerId);

    res.status(200);
    res.json(groupJson);
})

// Edit a group
router.post('/:groupId', async (req, res) => {
    const { name, about, type, private, city, state } = req.body;
    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
        include: {
            model: User,
            through: {
                model: Member,
                where: { status: 'organizer' }
            }
        }
    });
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        });
    }

    try {
        await group.set({
            name,
            about,
            type,
            private,
            city,
            state
        });
        const groupJson = group.toJSON();
        groupJson.organizerId = groupJson.Users[0].id;
        delete groupJson.Users;
        res.status(200);
        return res.json(groupJson);
    } catch (error) {
        // console.log(error);
        res.status(400);
        return res.json(groupValidateError);
    }
})

// Delete a group
router.delete('/:groupId', async (req, res) => {
    const { token } = req.cookies;
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.data.id;

    const groupId = req.params.groupId;
    const group = await Group.findByPk(groupId, {
        include: {
            model: User,
            through: {
                model: Member,
                where: { status: 'organizer' }
            }
        }
    });
    if (!group) {
        res.status(404);
        return res.json({
            message: "Group couldn't be found"
        });
    }

    const groupJson = group.toJSON();
    const organizerId = groupJson.Users[0].id;

    if (userId === organizerId) {
        await group.destroy();
        res.status(200);
        return res.json({
            message: "Successfully deleted"
        });
    }
    else {
        res.status(400);
        return res.json({
            message: "Invalid Authorization"
        })
    }
})

// Get all groups joined or organized by current user
router.get('/currentUser', async (req, res) => {
    const { token } = req.cookies;
    // console.log(token);

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decodedToken);

    const userId = decodedToken.data.id;
    // console.log(userId);
    
    const groups = await Group.findAll({
        where: {
            '$Users.id$': userId
        },
        include: [
            {
                model: User,
                through: { 
                    model: Member,
                    where: { status: 'organizer' },
                    attributes: []
                },
                attributes: ['id']
            },
            {
                model: Image,
                where: {
                    preview: true
                },
                attributes: ['url']
            }
        ]
    });
    // console.log(groups);

    const payload = groups.map(group => {
        const groupJson = group.toJSON();
        const organizerId = groupJson.Users[0].id;
        const previewImage = groupJson.Images[0].url;

        delete groupJson.Users;
        delete groupJson.Images;

        return {
            ...groupJson,
            organizerId,
            previewImage
        };
    })

    res.status(200);
    res.json({
        Groups: payload
    });
})

// Get all group
router.get('/', async (_req, res) => {
    const groups = await Group.findAll({
        include: [
            {
                model: User,
                through: { 
                    model: Member,
                    where: { status: 'organizer' },
                    attributes: []
                },
                attributes: ['id']
            },
            {
                model: Image,
                where: {
                    preview: true
                },
                attributes: ['url']
            }
        ]
    });

    const payload = groups.map(group => {
        const groupJson = group.toJSON();
        const organizerId = groupJson.Users[0].id;
        const previewImage = groupJson.Images[0].url;

        delete groupJson.Users;
        delete groupJson.Images;

        return {
            ...groupJson,
            organizerId,
            previewImage
        };
    })

    res.status(200);
    res.json({
        Groups: payload
    });
});

// Create a new group
router.post('/', async (req, res) => {
    const { name, about, type, private, city, state } = req.body;
    // console.log(req.body);

    const { token } = req.cookies;
    // console.log(token);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decodedToken);
    const userId = decodedToken.data.id;

    try {
        const group = await Group.create({
            name,
            about,
            type,
            private,
            city,
            state
        });
        const groupJson = group.toJSON();
        delete groupJson.numMembers;
        
        const member = await Member.create({
            userId: userId,
            groupId: groupJson.id,
            status: 'organizer'
        });
        groupJson.organizerId = member.userId;

        res.status(201);
        return res.json(groupJson);
    } 
    catch (error) {
        // console.log(error);

        res.status(400);
        return res.json({
            message: "Bad Request", // (or "Validation error" if generated by Sequelize),
            errors: {
                name: "Name must be 60 characters or less",
                about: "About must be 50 characters or more",
                type: "Type must be 'Online' or 'In person'",
                private: "Private must be a boolean",
                city: "City is required",
                state: "State is required",
            }
        });
    }
})



module.exports = router;