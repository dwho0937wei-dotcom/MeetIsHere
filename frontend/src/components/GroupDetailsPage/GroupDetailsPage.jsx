import isUrl from 'is-url';
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useParams, useNavigate } from "react-router-dom";
import { getAllGroupEvents } from '../../store/event';
import { getGroup } from '../../store/group';
import OpenModalMenuItem from '../OpenModalButton';
import DeleteGroupFormModal from '../DeleteGroupFormModal';
import "./GroupDetailsPage.css";

const GroupDetailsPage = () => {
    const { groupId } = useParams();

    //! Dispatching for loading the group and its hosted events
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getGroup(groupId));
        dispatch(getAllGroupEvents(groupId));
    }, [dispatch, groupId]);

    //! Extracting the group itself with its hosted events
    const group = useSelector(state => state.groups.currentGroup);
    const groupEvents = useSelector(state => state.events.currentGroupEvents);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (group && groupEvents) {
            setIsLoaded(true);
        }
    }, [setIsLoaded, group, groupEvents]);

    //! Separating the upcoming and past events hosted by the group
    const upcomingEvents = [];
    const pastEvents = [];
    if (isLoaded && groupEvents.length > 0) {
        groupEvents.forEach(event => {
            const endDate = event.endDate;
            const today = new Date().toISOString();

            if (endDate >= today) {
                upcomingEvents.push(event);
            }
            else {
                pastEvents.push(event);
            }
        })
    }
    // console.log("Future Events:", upcomingEvents);
    // console.log("Past Events:", pastEvents);

    //! Sorting the events by dates
    function compareFn(eventA, eventB) {
        if (eventA.endDate < eventB.endDate) {
            return -1;
        } else if (eventA.endDate > eventB.endDate) {
            return 1;
        } else if (eventA.startDate < eventB.startDate) {
            return -1;
        } else if (eventA.startDate > eventB.startDate) {
            return 1;
        }
        return 0;
    }
    function sortDates(events) {
        return events.sort(compareFn);
    }

    const sortedUpcomingEvents = sortDates(upcomingEvents);
    const sortedPastEvents = sortDates(pastEvents);
    // console.log("Future Events:", sortedUpcomingEvents);
    // console.log("Past Events:", sortedPastEvents);

    //! Extracting the group preview image
    const previewImage = isLoaded && group.GroupImages.find(img => img.preview);
    let groupImageUrl;
    if (previewImage && isUrl(previewImage.url)) {
        groupImageUrl = previewImage.url;
    }
    else {
        groupImageUrl = "https://cdn-icons-png.flaticon.com/256/681/681443.png"
    }

    //! Event preview image fill-in
    const eventImageFillIn = "https://static.vecteezy.com/system/resources/thumbnails/021/957/793/small_2x/event-outline-icons-simple-stock-illustration-stock-vector.jpg";

    //! Alert for the "Join this group" button coming soon...
    const [alert, setAlert] = useState({});
    function clickJoin() {
        const newAlert = { joinButton: "Feature Coming Soon..." }
        setAlert(newAlert);
    }

    //! Handling event from "Create event" button
    const navigate = useNavigate();
    function clickCreateEvent() {
        if (isLoaded) {
            navigate(`/groups/${group.id}/events`);
        }
    }

    //! Handling event from "Update" button
    function clickUpdate() {
        if (isLoaded) {
            navigate(`/groups/${group.id}/edit`)
        }
    }

    //! Buttons to display based on whether the user is an organizer or not
    const user = useSelector(state => state.session.user);
    function displayGroupButton() {
        if (isLoaded && user && user.id === group.organizerId) {
            return (
                <>
                    <button onClick={clickCreateEvent} className="groupDetailsBtns">Create event</button>{' '}
                    <button onClick={clickUpdate} className="groupDetailsBtns">Update</button>{' '}
                    <OpenModalMenuItem
                        className="groupDetailsBtns"
                        buttonText="Delete"
                        modalComponent={<DeleteGroupFormModal navigate={navigate} groupId={groupId}/>}
                    />
                </>
            )
        }
        else if (isLoaded && user) {
            return (
                <>
                    <button onClick={clickJoin} className='JoinGroupButton'>Join this group</button>
                    {' '}{alert.joinButton}
                </>
            )
        }
    }

    return (
        <>
            <div className="GroupDetailsSection">
                <div className="groupNav">
                    {"< "}<NavLink to="/groups" >Groups</NavLink>
                </div>
                {/* Group Upper Section */}
                <div className='GroupUpperSection'>
                    <div>
                        <img src={groupImageUrl} alt="Group Preview Image" />
                    </div>
                    <div>
                        <h1>{isLoaded ? group.name : "Loading..."}</h1>
                        <h3>
                            {isLoaded ? group.city : "Loading..."}{', '} 
                            {isLoaded ? group.state : "Loading..."}
                        </h3>
                        <h3>{isLoaded && groupEvents.length} events &middot; {isLoaded && !group.private ? 'Public' : 'Private'}</h3>
                        <h3>
                            {'Organized by: '}
                            {isLoaded ? group.Organizer.firstName : "Loading..."}{' '} 
                            {isLoaded ? group.Organizer.lastName : "Loading..."}
                        </h3>
                        {displayGroupButton()}
                    </div>
                </div>
                
                <div className="GroupLowerSection">
                    {/* About Section */}
                    <h1>What {"we're"} about</h1>
                    <p>{isLoaded ? group.about : "Loading..."}</p>

                    {/* Upcoming Event Section */}
                    {sortedUpcomingEvents.length > 0 && 
                        <h1>Upcoming Events ({sortedUpcomingEvents.length})</h1>}
                    {sortedUpcomingEvents.length > 0 && 
                        sortedUpcomingEvents.map(event => {
                            const [startDate, startTime] = event.startDate.split(" ");
                            const [endDate, endTime] = event.endDate.split(" ");
                            return (
                                <div key={event.id}>
                                     <h3>-------------------------------------------------------------------------</h3>
                                    <NavLink to={`/events/${event.id}`} className="eventCard">
                                        <div className="eventImageCaption">        
                                            <img 
                                                src={isUrl(event.previewImage) ? event.previewImage : eventImageFillIn} 
                                                alt="Event Preview Image" 
                                            />
                                            <div className='caption'>
                                                <h4>START: {startDate} &middot; {startTime}</h4>
                                                <h4>END: {endDate} &middot; {endTime}</h4>
                                                <h3>{event.name}</h3>
                                                <h4>{event.Venue ? `${event.Venue.city}, ${event.Venue.state}` : "Remote"}</h4>
                                            </div>
                                        </div>
                                        <p>{event.description}</p>
                                    </NavLink>
                                </div>
                            )
                        })
                    }

                    {/* Past Event Section */}
                    {sortedPastEvents.length > 0 && 
                        <h1>Past Events ({sortedPastEvents.length})</h1>}
                    {sortedPastEvents.length > 0 &&
                        sortedPastEvents.map(event => {
                            const [startDate, startTime] = event.startDate.split(" ");
                            const [endDate, endTime] = event.endDate.split(" ");
                            return (
                                <div key={event.id}>
                                    <h3>-------------------------------------------------------------------------</h3>
                                    <NavLink  to={`/events/${event.id}`} className="eventCard">
                                        <div className="eventImageCaption">
                                            <img 
                                                src={isUrl(event.previewImage) ? event.previewImage : eventImageFillIn} 
                                                alt="Event Preview Image" 
                                            />
                                            <div>
                                                <h4>START: {startDate} &middot; {startTime}</h4>
                                                <h4>END: {endDate} &middot; {endTime}</h4>
                                                <h3>{event.name}</h3>
                                                <h4>{event.Venue ? `${event.Venue.city}, ${event.Venue.state}` : "Remote"}</h4>
                                            </div>
                                        </div>
                                        <p>{event.description}</p>
                                    </NavLink>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
        </>
    )
}

export default GroupDetailsPage;