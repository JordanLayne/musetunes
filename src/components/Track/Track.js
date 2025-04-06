import React, { useState, useCallback } from "react";
import "./Track.css";

const Track = React.memo((props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const addTrack = useCallback(
    (event) => {
      event.stopPropagation();
      props.onAdd(props.track);
    },
    [props.onAdd, props.track]
  );

  const removeTrack = useCallback(
    (event) => {
      event.stopPropagation();
      props.onRemove(props.track);
    },
    [props.onRemove, props.track]
  );

  const fetchYouTubePreview = useCallback(async () => {
    const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!apiKey) {
      setErrorMessage('YouTube API key is missing. Please configure it in your environment.');
      return;
    }
    const cleanTitle = props.track.name.replace(/\(feat\..*?\)/i, '').trim();
    const query = `${cleanTitle} ${props.track.artist} official audio`;
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
      );
      if (!response.ok) {
        throw new Error(`YouTube API error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoId = data.items[0].id.videoId;
        setYoutubeUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
        setErrorMessage(null);
      } else {
        console.log('No YouTube video found for:', props.track.name);
        setErrorMessage('No preview video found on YouTube');
        setYoutubeUrl(null);
      }
    } catch (error) {
      console.error('Error fetching YouTube preview:', error);
      if (error.message.includes('403')) {
        setErrorMessage('YouTube API quota exceeded or access denied');
      } else if (error.message.includes('400')) {
        setErrorMessage('Invalid YouTube API request - check API key');
      } else {
        setErrorMessage('Failed to fetch YouTube preview');
      }
      setYoutubeUrl(null);
    }
  }, [props.track.name, props.track.artist]);

  const playPreview = useCallback((event) => {
    event.stopPropagation(); // Prevent click from bubbling to parent div
    if (!youtubeUrl) {
      fetchYouTubePreview();
    }
  }, [youtubeUrl, fetchYouTubePreview]);

  const renderAction = () => {
    if (props.isRemoval) {
      return (
        <button className="Track-action" onClick={removeTrack}>
          -
        </button>
      );
    }
    return (
      <button className="Track-action" onClick={addTrack}>
        +
      </button>
    );
  };

  return (
    <div className={`Track ${isExpanded ? 'expanded' : ''}`} onClick={toggleExpand}>
      <div className="Track-main">
        {props.track.albumCover && (
          <img 
            src={props.track.albumCover} 
            alt="Album Cover" 
            className="Track-album-cover"
          />
        )}
        <div className="Track-information">
          <h3>{props.track.name}</h3>
          <p>
            <a 
              href={`https://open.spotify.com/artist/${props.track.artistId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {props.track.artist}
            </a> | 
            <a 
              href={`https://open.spotify.com/album/${props.track.albumId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {props.track.album}
            </a>
          </p>
        </div>
        {renderAction()}
      </div>
      {isExpanded && (
        <div className="Track-details">
          <div className="Track-preview">
            <button onClick={playPreview}>Play Preview</button>
            {youtubeUrl ? (
              <iframe 
                width="200" 
                height="150" 
                src={youtubeUrl} 
                title="YouTube Preview" 
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
              />
            ) : (
              errorMessage && <p className="Track-error">{errorMessage}</p>
            )}
          </div>
          <a 
            href={`https://open.spotify.com/track/${props.track.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="Track-spotify-link"
          >
            Open in Spotify
          </a>
        </div>
      )}
    </div>
  );
});

export default Track;