let accessToken;
const clientId = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const redirectUri = 'http://localhost:3000';

const Spotify = {
  getAccessToken() {
    return new Promise((resolve) => {
      if (accessToken) {
        resolve(accessToken);
        return;
      }

      const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
      const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);
      if (accessTokenMatch && expiresInMatch) {
        accessToken = accessTokenMatch[1];
        const expiresIn = Number(expiresInMatch[1]);
        window.setTimeout(() => (accessToken = ''), expiresIn * 1000);
        window.history.pushState('Access Token', null, '/');
        resolve(accessToken);
      } else {
        if (!clientId) {
          console.error('Spotify Client ID is not set. Please set REACT_APP_SPOTIFY_CLIENT_ID in your environment.');
          alert('Configuration error: Spotify Client ID is missing.');
          resolve(null);
          return;
        }
        const pendingTerm = localStorage.getItem('pendingSearchTerm');
        const accessUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${encodeURIComponent(redirectUri)}${pendingTerm ? '&state=' + encodeURIComponent(pendingTerm) : ''}`;
        window.location = accessUrl;
      }
    });
  },

  search(term) {
    localStorage.setItem('pendingSearchTerm', term);
    return Spotify.getAccessToken().then((token) => {
      if (!token) {
        console.log('Redirecting for authentication...');
        return [];
      }
      localStorage.removeItem('pendingSearchTerm');
      return fetch(`https://api.spotify.com/v1/search?type=track&q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonResponse => {
          if (!jsonResponse.tracks) {
            console.log('No tracks found in response:', jsonResponse);
            return [];
          }
          return jsonResponse.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            artistId: track.artists[0].id,
            album: track.album.name,
            albumId: track.album.id,
            uri: track.uri,
            albumCover: track.album.images[0]?.url || ''
          }));
        })
        .catch(error => {
          console.error('Search failed:', error);
          return [];
        });
    });
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris.length) {
      return Promise.resolve();
    }

    return Spotify.getAccessToken().then((token) => {
      if (!token) {
        console.error('No token available for saving playlist');
        return Promise.reject('Authentication required');
      }
      const headers = { Authorization: `Bearer ${token}` };
      let userId;

      return fetch('https://api.spotify.com/v1/me', { headers })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonResponse => {
          userId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            headers,
            method: 'POST',
            body: JSON.stringify({ name })
          });
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(jsonResponse => {
          const playlistId = jsonResponse.id;
          return fetch(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`, {
            headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackUris })
          });
        })
        .catch(error => {
          console.error('Save playlist failed:', error);
          return Promise.reject(error);
        });
    });
  }
};

export default Spotify;