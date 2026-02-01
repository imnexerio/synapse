import {
  ref,
  onValue,
  push,
  set,
  remove,
  update,
  runTransaction,
  off,
  get
} from 'firebase/database';
import { database } from './firebaseConfig';

// ============ REALTIME LISTENERS ============

/**
 * Subscribe to user's topics - returns unsubscribe function
 * @param {string} userId - User ID
 * @param {Function} onUpdate - Callback with topics array
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTopics(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const topicsRef = ref(database, `users/${userId}/topics`);

  const handleValue = (snapshot) => {
    const data = snapshot.val();
    const topics = data
      ? Object.values(data).sort((a, b) => b.createdAt - a.createdAt)
      : [];
    onUpdate(topics);
  };

  const handleError = (error) => {
    console.error('Firebase topics subscription error:', error);
    if (onError) onError(error);
  };

  onValue(topicsRef, handleValue, handleError);

  // Return cleanup function
  return () => off(topicsRef);
}

/**
 * Subscribe to user's tags - returns unsubscribe function
 * @param {string} userId - User ID
 * @param {Function} onUpdate - Callback with tags object
 * @param {Function} onError - Callback for errors
 * @returns {Function} Unsubscribe function
 */
export function subscribeToTags(userId, onUpdate, onError) {
  if (!userId) {
    onUpdate({});
    return () => {};
  }

  const tagsRef = ref(database, `users/${userId}/tags`);

  const handleValue = (snapshot) => {
    const data = snapshot.val() || {};
    onUpdate(data);
  };

  const handleError = (error) => {
    console.error('Firebase tags subscription error:', error);
    if (onError) onError(error);
  };

  onValue(tagsRef, handleValue, handleError);

  return () => off(tagsRef);
}

// ============ WRITE OPERATIONS ============

/**
 * Add a new topic
 * @param {string} userId - User ID
 * @param {Object} topic - Topic data (title, description, tags, date)
 * @returns {Promise<string>} The new topic ID
 */
export async function addTopic(userId, topic) {
  if (!userId) throw new Error('User not authenticated');

  const topicId = `topic_${Date.now()}`;
  const topicData = {
    id: topicId,
    title: topic.title,
    description: topic.description || '',
    tags: topic.tags,
    date: topic.date,
    createdAt: Date.now()
  };

  // Save topic
  await set(ref(database, `users/${userId}/topics/${topicId}`), topicData);

  // Increment tag counts
  for (const tag of topic.tags) {
    await runTransaction(ref(database, `users/${userId}/tags/${tag}/count`), (current) => {
      return (current || 0) + 1;
    });
  }

  return topicId;
}

/**
 * Update an existing topic
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @param {Object} updates - Updated topic data
 * @param {string[]} oldTags - Previous tags (for count adjustment)
 * @param {string[]} newTags - New tags
 */
export async function updateTopic(userId, topicId, updates, oldTags, newTags) {
  if (!userId) throw new Error('User not authenticated');

  // Update topic data
  await update(ref(database, `users/${userId}/topics/${topicId}`), {
    ...updates,
    updatedAt: Date.now()
  });

  // Handle tag count changes
  const removedTags = oldTags.filter(t => !newTags.includes(t));
  const addedTags = newTags.filter(t => !oldTags.includes(t));

  for (const tag of removedTags) {
    await runTransaction(ref(database, `users/${userId}/tags/${tag}/count`), (c) =>
      Math.max(0, (c || 0) - 1)
    );
  }

  for (const tag of addedTags) {
    await runTransaction(ref(database, `users/${userId}/tags/${tag}/count`), (c) =>
      (c || 0) + 1
    );
  }
}

/**
 * Delete a topic
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @param {string[]} tags - Topic's tags (for count adjustment)
 */
export async function deleteTopic(userId, topicId, tags) {
  if (!userId) throw new Error('User not authenticated');

  // Remove topic
  await remove(ref(database, `users/${userId}/topics/${topicId}`));

  // Decrement tag counts
  for (const tag of tags) {
    await runTransaction(ref(database, `users/${userId}/tags/${tag}/count`), (c) =>
      Math.max(0, (c || 0) - 1)
    );
  }
}

/**
 * Get a single topic by ID
 * @param {string} userId - User ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object|null>} Topic data or null
 */
export async function getTopic(userId, topicId) {
  if (!userId) return null;
  const snapshot = await get(ref(database, `users/${userId}/topics/${topicId}`));
  return snapshot.val();
}

/**
 * Get all tags with counts
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Tags object { tagName: { count: number } }
 */
export async function getAllTags(userId) {
  if (!userId) return {};
  const snapshot = await get(ref(database, `users/${userId}/tags`));
  return snapshot.val() || {};
}
