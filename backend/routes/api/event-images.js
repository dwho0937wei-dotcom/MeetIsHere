const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User, Group, Membership, GroupImage, Sequelize, Venue, Event, Attendance, EventImage} = require('../../db/models');
const { userLoggedIn, requireAuth2, requireProperAuth } = require('../../utils/auth');
const { getUserFromToken } = require('../../utils/helper');

const router = express.Router();

// Delete an image for an event
router.delete('/:imageId', async (req, res) => {
    if (!userLoggedIn(req)) {
        return requireAuth2(res);
    }
    const loginUser = getUserFromToken(req);

    const imageId = req.params.imageId;
    const image = await EventImage.findByPk(imageId);
    if (!image) {
        res.status(404);
        return res.json({
            message: "Event Image couldn't be found"
        })
    }

    const event = await image.getEvent();
    const groupId = event.dataValues.groupId;
    const group = await Group.findByPk(groupId);

    const coHost = await Membership.findOne({
        where: {userId: loginUser.id, groupId, status: 'co-host'}
    });
    if (group.dataValues.organizerId !== loginUser.id && !coHost) {
        return requireProperAuth(res);
    }

    res.status(200);
    await image.destroy();
    return res.json({
        message: "Successfully deleted"
    });
})

module.exports = router;