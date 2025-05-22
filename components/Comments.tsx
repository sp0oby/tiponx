import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, Reply, Heart } from 'lucide-react'

interface Comment {
  _id: string
  content: string
  authorHandle: string
  profileHandle: string
  parentCommentId?: string
  likes: string[]
  createdAt: string
  updatedAt: string
  isDeleted?: boolean
}

interface CommentsProps {
  profileHandle: string
}

export function Comments({ profileHandle }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?profileHandle=${profileHandle}`)
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [profileHandle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          profileHandle,
          parentCommentId: replyTo
        })
      })

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prevComments => [newCommentData, ...prevComments]);
        setNewComment('')
        setReplyTo(null)
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchComments()
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleLike = async (commentId: string) => {
    const userHandle = session?.user?.handle;
    if (!userHandle || likingComments.has(commentId)) return;

    setLikingComments(prev => new Set([...prev, commentId]));
    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      });

      if (response.ok) {
        const { liked } = await response.json();
        setComments(comments => comments.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              likes: liked
                ? [...comment.likes, userHandle]
                : comment.likes.filter(handle => handle !== userHandle)
            };
          }
          return comment;
        }));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setLikingComments(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment, isReply?: boolean }) => {
    const isLiked = session?.user?.handle && comment.likes.includes(session.user.handle);
    const isLiking = likingComments.has(comment._id);
    const replies = comments.filter(c => c.parentCommentId === comment._id);

    return (
      <>
        <div className={`flex space-x-4 p-4 border-b border-gray-200 ${isReply ? 'ml-8 bg-gray-50' : ''}`}>
          <Avatar className="w-10 h-10" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{comment.authorHandle}</span>
                <span className="text-gray-500 text-sm">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {replyingTo?.authorHandle === comment.authorHandle && (
                  <span className="text-blue-500 text-sm">Replying to this comment</span>
                )}
              </div>
              {session?.user?.handle === comment.authorHandle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-gray-700">{comment.content}</p>
            <div className="flex items-center space-x-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setReplyTo(comment._id);
                  setReplyingTo(comment);
                }}
              >
                <Reply className="w-4 h-4 mr-1" />
                Reply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${isLiked ? 'text-red-500 hover:text-red-700' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => handleLike(comment._id)}
                disabled={!session || isLiking}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''} ${isLiking ? 'animate-pulse' : ''}`} />
                {comment.likes.length}
              </Button>
            </div>
          </div>
        </div>
        {/* Display replies */}
        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply._id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </>
    );
  };

  // Filter out replies from the main comment list
  const topLevelComments = comments.filter(comment => !comment.parentCommentId);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Comments</h2>
      
      {session ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? `Reply to ${replyingTo?.authorHandle}...` : "Write a comment..."}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            {replyTo && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setReplyTo(null);
                  setReplyingTo(null);
                }}
              >
                Cancel Reply
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Posting...' : replyTo ? 'Post Reply' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-gray-500 mb-6">Please sign in to leave a comment.</p>
      )}

      <div className="space-y-4">
        {topLevelComments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} />
        ))}
      </div>
    </div>
  )
} 