package com.uam.repository;

import com.uam.model.RiskScore;
import com.uam.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {
    Optional<RiskScore> findByUser(User user);
    Optional<RiskScore> findByUserId(Long userId);
    List<RiskScore> findAllByOrderByScoreDesc();
    List<RiskScore> findByLevelIn(List<RiskScore.RiskLevel> levels);

    @Query("SELECT r FROM RiskScore r WHERE r.level IN ('HIGH','CRITICAL') ORDER BY r.score DESC")
    List<RiskScore> findHighRisk();

    @Query("SELECT COUNT(r) FROM RiskScore r WHERE r.level = :level")
    long countByLevel(@Param("level") RiskScore.RiskLevel level);
}
