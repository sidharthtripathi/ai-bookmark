export type ClassifiedUrl =
  | { valid: false; reason: string }
  | { valid: true; platform: 'youtube';   resource: 'video';     videoId: string;       normalised: string }
  | { valid: true; platform: 'youtube';   resource: 'short';     videoId: string;       normalised: string }
  | { valid: true; platform: 'youtube';   resource: 'channel';   channelHandle: string; normalised: string }
  | { valid: true; platform: 'twitter';   resource: 'tweet';     tweetId: string;      username: string;   normalised: string }
  | { valid: true; platform: 'twitter';   resource: 'profile';   username: string;      normalised: string }
  | { valid: true; platform: 'instagram'; resource: 'post';      shortcode: string;     normalised: string }
  | { valid: true; platform: 'instagram'; resource: 'reel';      shortcode: string;     normalised: string }
  | { valid: true; platform: 'instagram'; resource: 'profile';   username: string;      normalised: string }
  | { valid: true; platform: 'reddit';    resource: 'thread';    subreddit: string;      postId: string;     normalised: string }
  | { valid: true; platform: 'reddit';    resource: 'subreddit'; subreddit: string;      normalised: string }
  | { valid: true; platform: 'reddit';    resource: 'user';      username: string;      normalised: string }
  | { valid: true; platform: 'web';       resource: 'article';  normalised: string };

export function classifyUrl(url: string): ClassifiedUrl {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return { valid: false, reason: 'invalid_url' }; }

  const hostname = parsed.hostname.replace('www.', '');
  const path = parsed.pathname;

  // ── YOUTUBE ──────────────────────────────────────────────────────────────
  if (hostname === 'youtube.com' || hostname === 'youtu.be') {

    // Short URL: youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const videoId = path.slice(1).split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId))
        return { valid: true, platform: 'youtube', resource: 'video', videoId,
                 normalised: `https://www.youtube.com/watch?v=${videoId}` };
    }

    // Regular video: /watch?v=VIDEO_ID
    const watchId = parsed.searchParams.get('v');
    if (path === '/watch' && watchId && /^[a-zA-Z0-9_-]{11}$/.test(watchId))
      return { valid: true, platform: 'youtube', resource: 'video', videoId: watchId,
               normalised: `https://www.youtube.com/watch?v=${watchId}` };

    // Shorts: /shorts/VIDEO_ID
    const shortsMatch = path.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch)
      return { valid: true, platform: 'youtube', resource: 'short', videoId: shortsMatch[1],
               normalised: `https://www.youtube.com/shorts/${shortsMatch[1]}` };

    // Channel — four possible URL formats:
    //   /@handle  |  /c/name  |  /channel/UCxxxxxxxx  |  /user/name
    const channelMatch = path.match(/^\/@([^/]+)$/) ||
                         path.match(/^\/c\/([^/]+)$/) ||
                         path.match(/^\/channel\/([^/]+)$/) ||
                         path.match(/^\/user\/([^/]+)$/);
    if (channelMatch) {
      const handle = channelMatch[1];
      const isUCId = path.startsWith('/channel/');
      const normalised = isUCId
        ? `https://www.youtube.com/channel/${handle}`
        : `https://www.youtube.com/@${handle}`;
      return { valid: true, platform: 'youtube', resource: 'channel', channelHandle: handle, normalised };
    }

    return { valid: false, reason: 'unrecognised_youtube_url' };
  }

  // ── TWITTER / X ──────────────────────────────────────────────────────────
  if (hostname === 'twitter.com' || hostname === 'x.com') {

    // Tweet URL: /USERNAME/status/TWEET_ID
    const tweetMatch = path.match(/^\/([^/]+)\/status\/(\d+)/);
    if (tweetMatch)
      return { valid: true, platform: 'twitter', resource: 'tweet',
               username: tweetMatch[1], tweetId: tweetMatch[2],
               normalised: `https://x.com/${tweetMatch[1]}/status/${tweetMatch[2]}` };

    // Profile URL: /USERNAME (single path segment, no /status/)
    const profileMatch = path.match(/^\/([^/]+)$/);
    const TWITTER_RESERVED_PATHS = ['i', 'home', 'explore', 'notifications', 'messages',
                                     'settings', 'search', 'hashtag', 'login', 'signup'];
    if (profileMatch && !TWITTER_RESERVED_PATHS.includes(profileMatch[1].toLowerCase()))
      return { valid: true, platform: 'twitter', resource: 'profile',
               username: profileMatch[1],
               normalised: `https://x.com/${profileMatch[1]}` };

    // /i/web/status/TWEET_ID — alternate internal URL format
    const altTweetMatch = path.match(/^\/i\/web\/status\/(\d+)/);
    if (altTweetMatch)
      return { valid: true, platform: 'twitter', resource: 'tweet',
               username: 'unknown', tweetId: altTweetMatch[1],
               normalised: `https://x.com/i/web/status/${altTweetMatch[1]}` };

    return { valid: false, reason: 'unrecognised_twitter_url' };
  }

  // ── INSTAGRAM ─────────────────────────────────────────────────────────────
  if (hostname === 'instagram.com') {

    // Post: /p/SHORTCODE/
    const postMatch = path.match(/^\/p\/([^/]+)/);
    if (postMatch)
      return { valid: true, platform: 'instagram', resource: 'post',
               shortcode: postMatch[1],
               normalised: `https://www.instagram.com/p/${postMatch[1]}` };

    // Reel: /reel/SHORTCODE/
    const reelMatch = path.match(/^\/reel\/([^/]+)/);
    if (reelMatch)
      return { valid: true, platform: 'instagram', resource: 'reel',
               shortcode: reelMatch[1],
               normalised: `https://www.instagram.com/reel/${reelMatch[1]}` };

    // Legacy video: /tv/SHORTCODE/
    const tvMatch = path.match(/^\/tv\/([^/]+)/);
    if (tvMatch)
      return { valid: true, platform: 'instagram', resource: 'reel',
               shortcode: tvMatch[1],
               normalised: `https://www.instagram.com/reel/${tvMatch[1]}` };

    // Profile: /USERNAME/
    const profileMatch = path.match(/^\/([^/]+)\/?$/);
    const INSTAGRAM_RESERVED_PATHS = ['explore', 'reels', 'stories', 'direct', 'accounts', 'ar'];
    if (profileMatch && !INSTAGRAM_RESERVED_PATHS.includes(profileMatch[1].toLowerCase()))
      return { valid: true, platform: 'instagram', resource: 'profile',
               username: profileMatch[1],
               normalised: `https://www.instagram.com/${profileMatch[1]}` };

    return { valid: false, reason: 'unrecognised_instagram_url' };
  }

  // ── REDDIT ────────────────────────────────────────────────────────────────
  if (hostname === 'reddit.com' || hostname === 'old.reddit.com' || hostname === 'np.reddit.com') {

    // Thread: /r/SUBREDDIT/comments/POST_ID/...
    const threadMatch = path.match(/^\/r\/([^/]+)\/comments\/([^/]+)/);
    if (threadMatch)
      return { valid: true, platform: 'reddit', resource: 'thread',
               subreddit: threadMatch[1], postId: threadMatch[2],
               normalised: `https://www.reddit.com/r/${threadMatch[1]}/comments/${threadMatch[2]}` };

    // New share URL format: /r/SUBREDDIT/s/SHORTID
    const shareMatch = path.match(/^\/r\/([^/]+)\/s\/([^/]+)/);
    if (shareMatch)
      return { valid: true, platform: 'reddit', resource: 'subreddit',
               subreddit: shareMatch[1],
               normalised: `https://www.reddit.com/r/${shareMatch[1]}` };

    // Subreddit: /r/SUBREDDIT/
    const subredditMatch = path.match(/^\/r\/([^/]+)\/?$/);
    if (subredditMatch)
      return { valid: true, platform: 'reddit', resource: 'subreddit',
               subreddit: subredditMatch[1],
               normalised: `https://www.reddit.com/r/${subredditMatch[1]}` };

    // User profile: /u/USERNAME/ or /user/USERNAME/
    const userMatch = path.match(/^\/u(?:ser)?\/([^/]+)/);
    if (userMatch)
      return { valid: true, platform: 'reddit', resource: 'user',
               username: userMatch[1],
               normalised: `https://www.reddit.com/u/${userMatch[1]}` };

    return { valid: false, reason: 'unrecognised_reddit_url' };
  }

  // ── WEB (generic fallback) ────────────────────────────────────────────────
  const cleanUrl = new URL(url);
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content',
   'fbclid','gclid','ref','source'].forEach(p => cleanUrl.searchParams.delete(p));
  const normalised = cleanUrl.toString().replace(/\/$/, '');

  return { valid: true, platform: 'web', resource: 'article', normalised };
}
