import isUrl from 'is-url';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { getEventDetails } from "../../store/event";
import OpenModalMenuItem from '../OpenModalButton';
import DeleteEventFormModal from '../DeleteEventFormModal';
import "./EventDetailsPage.css";

const EventDetailsPage = () => {
    const { eventId } = useParams();
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(getEventDetails(eventId)).catch(errors => errors.json());
    }, [dispatch, eventId]);

    const event = useSelector(state => state.events.currentEvent);
    const [isLoaded, setIsLoaded] = useState(false);
    useEffect(() => {
        if (event) {
            setIsLoaded(true);
        }
    }, [event, setIsLoaded])

    //! Extracting the event preview image or filling a default one in
    const previewImage = isLoaded && event.EventImages.find(img => img.preview);
    let eventImageUrl;
    if (previewImage && isUrl(previewImage.url)) {
        eventImageUrl = previewImage.url;
    }
    else {
        eventImageUrl = "https://static.vecteezy.com/system/resources/thumbnails/021/957/793/small_2x/event-outline-icons-simple-stock-illustration-stock-vector.jpg"
    }

    //! Display the update/delete event buttons for the creator of this event
    const navigate = useNavigate();
    const user = useSelector(state => state.session.user);
    const displayEventButtons = () => {
        const creator = event.eventHost;
        if (user && user.id === creator.id) {
            return (
                <div className="twoBtns">
                    <button className="btn">Update</button>
                    <OpenModalMenuItem
                    buttonText="Delete"
                    modalComponent={<DeleteEventFormModal navigate={navigate} eventId={eventId}/>}
                    className="btn"
                    />
                </div>
            )
        }
    }
    const [startDate, startTime] = isLoaded ? event.startDate.split(" ") : [isLoaded, isLoaded];
    const [endDate, endTime] = isLoaded ? event.endDate.split(" ") : [isLoaded, isLoaded];

    //! Extracting the associated Group Preview Image Url
    //! If invalid url, have a valid default one fill in.
    const group = isLoaded && event.Group;
    const groupPreviewImage = isLoaded && group.GroupImages.length > 0 && isUrl(group.GroupImages[0].url) ? event.Group.GroupImages[0].url : "https://cdn-icons-png.flaticon.com/256/681/681443.png";

    return (
        <>
            <div className="UpperSection">
                {'< '}<NavLink to="/events">Events</NavLink>
                {/* Top Section */}
                <h1>{isLoaded && event.name}</h1>
                <h3>Hosted by: {`${isLoaded && event.eventHost.firstName} ${isLoaded && event.eventHost.lastName}`}</h3>
            </div>
            <div className="BottomSection">
                <div className='ImgInfo'>
                    {/* Event Image */}
                    <img 
                        src={eventImageUrl} 
                        alt={eventImageUrl} 
                    />
                    <div>
                        {/* Group Info Box */}
                        <NavLink className="ImgInfoBox" to={`/groups/${group.id}`}>
                            <img src={groupPreviewImage} alt="Group Preview Image" />
                            <div className="InfoBox1">
                                <h3>{isLoaded && event.Group.name}</h3>
                                <h3>
                                    {isLoaded && 
                                        (event.Group.private ? "Private" : "Public")
                                    }
                                </h3>
                            </div>
                        </NavLink>

                        {/* Event Info Box (Time, Price, & Type) */}
                        <div className="InfoBox2">
                            <div className="DateTime">
                                <span className="fa-solid fa-clock"></span> 
                                <div className="StartEnd">
                                    <h3>
                                        <div>
                                            START
                                        </div>
                                        <div>
                                            END
                                        </div>
                                    </h3>
                                    <h3>
                                        <div>
                                            {startDate} &middot; {startTime}
                                        </div>
                                        <div>
                                            {endDate} &middot; {endTime}
                                        </div>
                                    </h3>
                                </div>
                            </div>
                            <h3>
                                <div className='DateTime'>
                                    <span className="fa-solid fa-dollar-sign"></span>
                                    {
                                        isLoaded && 
                                            (event.price === 0 ? "FREE" : event.price)
                                    }
                                </div>
                            </h3>
                            <div className='TypeWithBtns'>
                                <div>
                                    <span className="fa-solid fa-map-pin"></span>
                                    <h3>{isLoaded && event.type}</h3>
                                </div>
                                {/* Buttons for updating/deleting the event */}
                                {isLoaded && displayEventButtons()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description Box */}
                <div>
                    <h1>Description</h1>
                    <p>{isLoaded && event.description}</p>
                </div>
            </div>
        </>
    )
}

export default EventDetailsPage;