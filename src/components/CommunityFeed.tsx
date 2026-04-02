import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { UserProfile, CommunityPost } from '../types';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  user: User;
  profile: UserProfile | null;
}

export default function CommunityFeed({ user, profile }: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityPost[];
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!newPost.trim() || isPosting) return;
    setIsPosting(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        authorName: profile?.displayName || user.displayName,
        authorPhoto: profile?.photoURL || user.photoURL,
        content: newPost,
        likes: [],
        timestamp: new Date().toISOString()
      });
      setNewPost('');
    } catch (error) {
      console.error("Error posting:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleLike = async (postId: string, likes: string[]) => {
    const postRef = doc(db, 'posts', postId);
    if (likes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex gap-3">
          <img src={user.photoURL || ''} className="w-10 h-10 rounded-full" alt="Me" />
          <textarea 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's on your mind?"
            className="flex-1 bg-transparent border-none focus:ring-0 text-white resize-none h-20"
          />
        </div>
        <div className="flex justify-end mt-2">
          <button 
            onClick={handlePost}
            disabled={!newPost.trim() || isPosting}
            className="bg-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-bold disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={post.authorPhoto || ''} className="w-10 h-10 rounded-full" alt={post.authorName} />
              <div>
                <div className="font-bold text-sm">{post.authorName}</div>
                <div className="text-xs text-zinc-500">
                  {post.timestamp ? formatDistanceToNow(new Date(post.timestamp)) + ' ago' : ''}
                </div>
              </div>
            </div>
            <div className="text-zinc-200 text-sm mb-4">{post.content}</div>
            <div className="flex items-center gap-6 pt-4 border-t border-zinc-800">
              <button 
                onClick={() => post.id && toggleLike(post.id, post.likes)}
                className={`flex items-center gap-1.5 text-sm ${post.likes.includes(user.uid) ? 'text-red-500' : 'text-zinc-400'}`}
              >
                <Heart className={`w-5 h-5 ${post.likes.includes(user.uid) ? 'fill-current' : ''}`} />
                {post.likes.length}
              </button>
              <button className="flex items-center gap-1.5 text-zinc-400 text-sm">
                <MessageCircle className="w-5 h-5" /> 0
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
