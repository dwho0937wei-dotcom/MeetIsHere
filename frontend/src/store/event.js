import { csrfFetch } from "./csrf";

// ------------------------------------ //
//!       Action Types
// ------------------------------------ //
const LOAD_ALL_EVENTS = 'event/LOAD_ALL_EVENTS';
const LOAD_EVENT_DETAILS = 'event/LOAD_EVENT_DETAILS';
const LOAD_ALL_GROUP_EVENTS = '/group/LOAD_ALL_GROUP_EVENTS';
const CREATE_EVENT = '/group/CREATE_EVENT';
const DELETE_EVENT = '/group/DELETE_EVENT';
const ADD_EVENT_IMAGE = '/event/ADD_EVENT_IMAGE';

// ------------------------------------ //
//!       Action Creators
// ------------------------------------ //
const loadAllEvent = eventList => ({
    type: LOAD_ALL_EVENTS,
    eventList
});
const loadEventDetails = currentEvent => ({
    type: LOAD_EVENT_DETAILS,
    currentEvent
})
const loadAllGroupEvents = groupEvents => ({
    type: LOAD_ALL_GROUP_EVENTS,
    groupEvents
});
const createEvent = newEvent => ({
    type: CREATE_EVENT,
    newEvent
})
const deleteEvent = () => ({
    type: DELETE_EVENT
})
const addEventImage = newEventImage => ({
    type: ADD_EVENT_IMAGE,
    newEventImage
})

// ------------------------------------ //
//!       Thunk Action Creators
// ------------------------------------ //
export const getAllEvents = () => async dispatch => {
    const response = await csrfFetch(`/api/events`);

    if (response.ok) {
        const list = await response.json();
        dispatch(loadAllEvent(list));
    }
}
export const getEventDetails = eventId => async dispatch => {
    const response = await csrfFetch(`/api/events/${eventId}`);

    if (response.ok) {
        const event = await response.json();
        dispatch(loadEventDetails(event));
    }
}
export const getAllGroupEvents = (groupId) => async dispatch => {
    const response = await csrfFetch(`/api/groups/${groupId}/events`);

    if (response.ok) {
        const groupEvents = await response.json();
        dispatch(loadAllGroupEvents(groupEvents));
        return groupEvents;
    }
}
export const createEventThunk = (groupId, body) => async dispatch => {
    const response = await csrfFetch(`/api/groups/${groupId}/events`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (response.ok) {
        const newEvent = await response.json();
        dispatch(createEvent(newEvent));
        return newEvent;
    }
    else {
        const errors = await response.json();
        console.log(errors.errors);
        return errors;
    }
}
export const deleteEventThunk = eventId => async dispatch => {
    const response = await csrfFetch(`/api/events/${eventId}`, {
        method: 'DELETE'
    });
    
    if (response.ok) {
        dispatch(deleteEvent())
    }
    else {
        const errors = await response.json();
        console.log(errors.errors);
        return errors;
    }
}
export const addEventImageThunk = (eventId, imageUrl, preview=true) => async dispatch => {
    const body = { url: imageUrl, preview };
    const response = await csrfFetch(`/api/events/${eventId}/images`, {
        method: 'POST',
        body: JSON.stringify(body)
    });

    if (response.ok) {
        const newEventImage = await response.json();
        dispatch(addEventImage(newEventImage));
        return newEventImage;
    }
    else{
        const errors = await response.json();
        console.log(errors.errors);
        return errors;
    }
}

// ------------------------------------ //
const initialState = {};

const eventReducer = (state = initialState, action) => {
    switch (action.type) {
        case LOAD_ALL_EVENTS: {
            const eventList = {};
            action.eventList.Events.forEach(event => {
                eventList[event.id] = event;
            })
            return {
                ...state,
                eventList: {...eventList}
            };
        }
        case LOAD_EVENT_DETAILS: {
            const event = {...action.currentEvent}
            return {
                ...state,
                currentEvent: event
            }
        }
        case LOAD_ALL_GROUP_EVENTS: {
            const currentGroupEvents = [...action.groupEvents.Events];
            return {
                ...state,
                currentGroupEvents
            }
        }
        case CREATE_EVENT: {
            const lastCreatedEvent = {...action.newEvent};
            return {
                ...state,
                lastCreatedEvent
            };
        }
        case DELETE_EVENT: {
            return state;
        }
        case ADD_EVENT_IMAGE: {
            const lastCreatedEventImage = {...action.newEventImage};
            return {
                ...state,
                lastCreatedEventImage
            }
        }
        default:
            return state;
    }
}

export default eventReducer;