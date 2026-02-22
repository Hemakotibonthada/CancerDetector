"""
Patient Engagement & Gamification API Routes
"""
from __future__ import annotations
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db_session
from app.models.patient_engagement import (
    GamificationProfile, Badge, UserBadge, HealthChallenge, ChallengeParticipation,
    HealthStreak, PeerSupportGroup, GroupMembership, GroupPost,
    PatientSatisfactionSurvey, PointTransaction, Reward, RewardRedemption,
)
from app.security import get_current_user_id

router = APIRouter(prefix="/patient-engagement", tags=["Patient Engagement"])

@router.get("/gamification/profile")
async def get_gamification_profile(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GamificationProfile).where(GamificationProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = GamificationProfile(user_id=user_id, total_points=0, level=1, current_streak=0)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile.to_dict()

@router.post("/gamification/points")
async def add_points(points: int = Body(...), reason: str = Body(...), user_id: str = Depends(get_current_user_id),
                     db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GamificationProfile).where(GamificationProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = GamificationProfile(user_id=user_id, total_points=0, level=1, current_streak=0)
        db.add(profile)
    profile.total_points = (profile.total_points or 0) + points
    profile.level = max(1, (profile.total_points // 100) + 1)
    txn = PointTransaction(user_id=user_id, points=points, reason=reason, transaction_type="earn")
    db.add(txn)
    await db.commit()
    await db.refresh(profile)
    return profile.to_dict()

@router.get("/gamification/leaderboard")
async def get_leaderboard(limit: int = 20, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GamificationProfile).order_by(desc(GamificationProfile.total_points)).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/badges")
async def list_badges(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(Badge).where(Badge.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/badges/my")
async def my_badges(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/badges/award")
async def award_badge(badge_id: str = Body(...), target_user_id: str = Body(...), db: AsyncSession = Depends(get_db_session)):
    ub = UserBadge(user_id=target_user_id, badge_id=badge_id, earned_at=datetime.now(timezone.utc))
    db.add(ub)
    await db.commit()
    await db.refresh(ub)
    return ub.to_dict()

@router.get("/challenges")
async def list_challenges(status: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(HealthChallenge).where(HealthChallenge.is_deleted == False)
    if status:
        q = q.where(HealthChallenge.status == status)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/challenges")
async def create_challenge(title: str = Body(...), description: str = Body(None), challenge_type: str = Body("health"),
                           goal_value: float = Body(None), points_reward: int = Body(10), duration_days: int = Body(30),
                           db: AsyncSession = Depends(get_db_session)):
    challenge = HealthChallenge(title=title, description=description, challenge_type=challenge_type,
                                 goal_value=goal_value, points_reward=points_reward, duration_days=duration_days)
    db.add(challenge)
    await db.commit()
    await db.refresh(challenge)
    return challenge.to_dict()

@router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    participation = ChallengeParticipation(challenge_id=challenge_id, user_id=user_id, joined_at=datetime.now(timezone.utc))
    db.add(participation)
    await db.commit()
    await db.refresh(participation)
    return participation.to_dict()

@router.put("/challenges/{challenge_id}/progress")
async def update_challenge_progress(challenge_id: str, progress: float = Body(...), user_id: str = Depends(get_current_user_id),
                                     db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(ChallengeParticipation).where(
        ChallengeParticipation.challenge_id == challenge_id, ChallengeParticipation.user_id == user_id))
    participation = result.scalar_one_or_none()
    if not participation:
        raise HTTPException(404, "Not enrolled in this challenge")
    participation.current_progress = progress
    if progress >= 100:
        participation.completed = True
        participation.completed_at = datetime.now(timezone.utc)
    await db.commit()
    return participation.to_dict()

@router.get("/streaks")
async def get_streaks(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(HealthStreak).where(HealthStreak.user_id == user_id, HealthStreak.is_deleted == False))
    return [r.to_dict() for r in result.scalars().all()]

@router.get("/support-groups")
async def list_support_groups(group_type: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PeerSupportGroup).where(PeerSupportGroup.is_deleted == False)
    if group_type:
        q = q.where(PeerSupportGroup.group_type == group_type)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/support-groups")
async def create_support_group(name: str = Body(...), group_type: str = Body(...), description: str = Body(None),
                                max_members: int = Body(50), user_id: str = Depends(get_current_user_id),
                                db: AsyncSession = Depends(get_db_session)):
    group = PeerSupportGroup(name=name, group_type=group_type, description=description, max_members=max_members, created_by=user_id)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group.to_dict()

@router.post("/support-groups/{group_id}/join")
async def join_support_group(group_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    membership = GroupMembership(group_id=group_id, user_id=user_id, joined_at=datetime.now(timezone.utc))
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership.to_dict()

@router.get("/support-groups/{group_id}/posts")
async def list_group_posts(group_id: str, skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(GroupPost).where(GroupPost.group_id == group_id, GroupPost.is_deleted == False)
                               .order_by(desc(GroupPost.created_at)).offset(skip).limit(limit))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/support-groups/{group_id}/posts")
async def create_group_post(group_id: str, content: str = Body(...), post_type: str = Body("discussion"),
                             user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    post = GroupPost(group_id=group_id, user_id=user_id, content=content, post_type=post_type)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post.to_dict()

@router.get("/surveys")
async def list_surveys(patient_id: Optional[str] = None, db: AsyncSession = Depends(get_db_session)):
    q = select(PatientSatisfactionSurvey).where(PatientSatisfactionSurvey.is_deleted == False)
    if patient_id:
        q = q.where(PatientSatisfactionSurvey.patient_id == patient_id)
    result = await db.execute(q)
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/surveys")
async def submit_survey(patient_id: str = Body(...), overall_rating: int = Body(...), comments: str = Body(None),
                        care_quality_rating: int = Body(None), communication_rating: int = Body(None),
                        db: AsyncSession = Depends(get_db_session)):
    survey = PatientSatisfactionSurvey(patient_id=patient_id, overall_rating=overall_rating, comments=comments,
                                        care_quality_rating=care_quality_rating, communication_rating=communication_rating)
    db.add(survey)
    await db.commit()
    await db.refresh(survey)
    return survey.to_dict()

@router.get("/rewards")
async def list_rewards(db: AsyncSession = Depends(get_db_session)):
    result = await db.execute(select(Reward).where(Reward.is_deleted == False, Reward.is_active == True))
    return [r.to_dict() for r in result.scalars().all()]

@router.post("/rewards/{reward_id}/redeem")
async def redeem_reward(reward_id: str, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db_session)):
    reward = await db.get(Reward, reward_id)
    if not reward:
        raise HTTPException(404, "Reward not found")
    result = await db.execute(select(GamificationProfile).where(GamificationProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile or (profile.total_points or 0) < (reward.points_cost or 0):
        raise HTTPException(400, "Insufficient points")
    profile.total_points -= reward.points_cost or 0
    redemption = RewardRedemption(user_id=user_id, reward_id=reward_id, points_spent=reward.points_cost, redeemed_at=datetime.now(timezone.utc))
    db.add(redemption)
    await db.commit()
    return redemption.to_dict()

@router.get("/dashboard/stats")
async def engagement_stats(db: AsyncSession = Depends(get_db_session)):
    profiles = await db.execute(select(func.count()).select_from(GamificationProfile))
    challenges = await db.execute(select(func.count()).select_from(HealthChallenge).where(HealthChallenge.is_deleted == False))
    groups = await db.execute(select(func.count()).select_from(PeerSupportGroup).where(PeerSupportGroup.is_deleted == False))
    surveys = await db.execute(select(func.count()).select_from(PatientSatisfactionSurvey).where(PatientSatisfactionSurvey.is_deleted == False))
    avg_rating = await db.execute(select(func.avg(PatientSatisfactionSurvey.overall_rating)).where(PatientSatisfactionSurvey.is_deleted == False))
    return {"total_gamified_users": profiles.scalar() or 0, "active_challenges": challenges.scalar() or 0,
            "support_groups": groups.scalar() or 0, "total_surveys": surveys.scalar() or 0,
            "average_satisfaction": round(avg_rating.scalar() or 0, 2)}
