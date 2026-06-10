package com.uam.repository;

import com.uam.model.AccessReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessReviewRepository extends JpaRepository<AccessReview, Long> {
    List<AccessReview> findByCampaignQuarterOrderByStatusAsc(String quarter);
    List<AccessReview> findByStatus(AccessReview.ReviewStatus status);
    List<AccessReview> findByUserId(Long userId);
    boolean existsByUserIdAndCampaignQuarter(Long userId, String quarter);

    @Query("SELECT COUNT(a) FROM AccessReview a WHERE a.campaignQuarter = :q AND a.status = :s")
    long countByQuarterAndStatus(@Param("q") String quarter,
                                  @Param("s") AccessReview.ReviewStatus status);

    @Query("SELECT DISTINCT a.campaignQuarter FROM AccessReview a ORDER BY a.campaignQuarter DESC")
    List<String> findDistinctQuarters();
}
