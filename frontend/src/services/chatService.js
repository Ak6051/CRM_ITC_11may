import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  doc,
  setDoc,
  updateDoc,
  increment,
  getDocs,
  limit
} from "firebase/firestore";
import { db } from "../config/firebase";

const CHATS_COLLECTION = "chats";
const STATUS_COLLECTION = "user_status";

/**
 * Sends a message to a specific recipient.
 */
export const sendMessage = async (senderId, receiverId, message, senderName) => {
  try {
    const chatRoomId = [senderId, receiverId].sort().join("_");
    const chatRef = collection(db, CHATS_COLLECTION, chatRoomId, "messages");
    
    await addDoc(chatRef, {
      senderId,
      receiverId,
      senderName,
      message,
      timestamp: serverTimestamp(),
      isRead: false
    });

    // Update unread count for receiver
    const statusRef = doc(db, STATUS_COLLECTION, receiverId, "notifications", senderId);
    await setDoc(statusRef, {
      count: increment(1),
      lastMessage: message,
      timestamp: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error };
  }
};

/**
 * Listens for real-time messages between two users.
 */
export const listenForMessages = (senderId, receiverId, callback) => {
  const chatRoomId = [senderId, receiverId].sort().join("_");
  const chatRef = collection(db, CHATS_COLLECTION, chatRoomId, "messages");
  const q = query(chatRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    callback(messages);
  });
};

/**
 * Updates the user's online/offline status.
 */
export const updateUserStatus = async (userId, status) => {
  try {
    const statusRef = doc(db, STATUS_COLLECTION, userId);
    await setDoc(statusRef, {
      status, // 'online' or 'offline'
      lastSeen: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

/**
 * Listens for real-time status of a user.
 */
export const listenForUserStatus = (userId, callback) => {
  const statusRef = doc(db, STATUS_COLLECTION, userId);
  return onSnapshot(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback(data);
    } else {
      callback({ status: 'offline' });
    }
  }, (error) => {
    console.error(`Error listening for status of ${userId}:`, error);
  });
};

/**
 * Clears unread count for a specific sender.
 */
export const clearUnreadCount = async (userId, senderId) => {
  try {
    const statusRef = doc(db, STATUS_COLLECTION, userId, "notifications", senderId);
    await setDoc(statusRef, { count: 0 }, { merge: true });
  } catch (error) {
    console.error("Error clearing unread count:", error);
  }
};

/**
 * Listens for all unread notifications for a user.
 */
export const listenForNotifications = (userId, callback) => {
  const notificationsRef = collection(db, STATUS_COLLECTION, userId, "notifications");
  return onSnapshot(notificationsRef, (snapshot) => {
    const notifications = {};
    snapshot.docs.forEach(doc => {
      notifications[doc.id] = doc.data();
    });
    callback(notifications);
  });
};
