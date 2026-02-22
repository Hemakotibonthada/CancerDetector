"""
Patient Engagement & Gamification Models
==========================================
Points, badges, achievements, health challenges, streaks,
leaderboards, peer support groups, and patient feedback.
"""
from __future__ import annotations
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class BadgeCategory(str, enum.Enum):
    HEALTH = "health"
    EXERCISE = "exercise"
    NUTRITION = "nutrition"
    ADHERENCE = "adherence"
    SCREENING = "screening"
    SOCIAL = "social"
    MILESTONE = "milestone"


class ChallengeStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"


class GamificationProfile(Base):
    """Gamification profile for patient engagement."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[int] = mapped_column(Integer, default=1)
    experience_points: Mapped[int] = mapped_column(Integer, default=0)
    points_to_next_level: Mapped[int] = mapped_column(Integer, default=100)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    badges_earned: Mapped[int] = mapped_column(Integer, default=0)
    challenges_completed: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    title: Mapped[str] = mapped_column(String(100), default="Health Novice")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    preferences: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class Badge(Base):
    """Achievement badge definition."""
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(30), default=BadgeCategory.HEALTH.value)
    icon_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    points_value: Mapped[int] = mapped_column(Integer, default=10)
    criteria: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    rarity: Mapped[str] = mapped_column(String(20), default="common")
    is_secret: Mapped[bool] = mapped_column(Boolean, default=False)
    total_earned: Mapped[int] = mapped_column(Integer, default=0)


class UserBadge(Base):
    """Badge earned by a user."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    badge_id: Mapped[str] = mapped_column(String(36), ForeignKey("badge.id"), nullable=False)
    earned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    displayed: Mapped[bool] = mapped_column(Boolean, default=True)
    share_enabled: Mapped[bool] = mapped_column(Boolean, default=False)


class HealthChallenge(Base):
    """Health challenge for patient engagement."""
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    duration_days: Mapped[int] = mapped_column(Integer, default=7)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=ChallengeStatus.UPCOMING.value)
    goals: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    reward_points: Mapped[int] = mapped_column(Integer, default=50)
    badge_reward_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("badge.id"), nullable=True)
    participants_count: Mapped[int] = mapped_column(Integer, default=0)
    completion_count: Mapped[int] = mapped_column(Integer, default=0)
    is_team_challenge: Mapped[bool] = mapped_column(Boolean, default=False)
    max_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rules: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class ChallengeParticipation(Base):
    """User participation in a challenge."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    challenge_id: Mapped[str] = mapped_column(String(36), ForeignKey("health_challenge.id"), nullable=False)
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    daily_log: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)


class HealthStreak(Base):
    """Track daily health activity streaks."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    streak_type: Mapped[str] = mapped_column(String(50), nullable=False)
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    best_count: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    broken_count: Mapped[int] = mapped_column(Integer, default=0)
    total_days: Mapped[int] = mapped_column(Integer, default=0)


class PeerSupportGroup(Base):
    """Peer support group for patients."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    cancer_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    moderator_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("user.id"), nullable=True)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    max_members: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    is_moderated: Mapped[bool] = mapped_column(Boolean, default=True)
    guidelines: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meeting_schedule: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    tags: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)


class GroupMembership(Base):
    """Membership in a peer support group."""
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("peer_support_group.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="member")
    joined_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    posts_count: Mapped[int] = mapped_column(Integer, default=0)
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class GroupPost(Base):
    """Post in a support group."""
    group_id: Mapped[str] = mapped_column(String(36), ForeignKey("peer_support_group.id"), nullable=False)
    author_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    post_type: Mapped[str] = mapped_column(String(30), default="discussion")
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    replies_count: Mapped[int] = mapped_column(Integer, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    parent_post_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    attachments: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)


class PatientSatisfactionSurvey(Base):
    """Patient satisfaction/experience surveys."""
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patient.id"), nullable=False)
    survey_type: Mapped[str] = mapped_column(String(100), nullable=False)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospital.id"), nullable=True)
    doctor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    overall_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    responses: Mapped[Optional[str]] = mapped_column(JSON, nullable=True)
    nps_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    would_recommend: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    follow_up_needed: Mapped[bool] = mapped_column(Boolean, default=False)


class PointTransaction(Base):
    """Point transaction log."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    source: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    reference_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    balance_after: Mapped[int] = mapped_column(Integer, default=0)


class Reward(Base):
    """Redeemable reward in health marketplace."""
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    stock: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    redeemed_count: Mapped[int] = mapped_column(Integer, default=0)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    partner_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class RewardRedemption(Base):
    """Record of reward redemption."""
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), nullable=False)
    reward_id: Mapped[str] = mapped_column(String(36), ForeignKey("reward.id"), nullable=False)
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    redemption_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
