package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberRequest;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AcademyMemberService {

    private final AcademyMemberRepository memberRepository;
    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;

    public AcademyMemberService(AcademyMemberRepository memberRepository,
                                AcademyRepository academyRepository,
                                UserProfileRepository userProfileRepository) {
        this.memberRepository = memberRepository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public AcademyMemberResponse addOrUpdateMember(UUID academyId, AcademyMemberRequest request) {
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> new EntityNotFoundException("Academy not found"));

        UserProfile user = userProfileRepository.findById(request.userId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        AcademyMemberId id = new AcademyMemberId(academyId, request.userId());

        return memberRepository.findById(id)
                .map(existing -> {
                    if (request.role() != null) existing.setRole(request.role());
                    if (request.status() != null) existing.setStatus(request.status());

                    if (request.belt() != null) {
                        existing.setBelt(request.belt());
                        syncGlobalProfileIfHigher(user, request.belt());
                    }

                    if (request.stripe() != null) {
                        existing.setStripe(request.stripe());
                    }

                    return AcademyMemberResponse.fromEntity(memberRepository.save(existing));
                })
                .orElseGet(() -> {
                    AcademyMember newMember = request.toEntity(academy, user);

                    if (request.belt() != null) {
                        syncGlobalProfileIfHigher(user, request.belt());
                    }

                    return AcademyMemberResponse.fromEntity(memberRepository.save(newMember));
                });
    }

    private void syncGlobalProfileIfHigher(UserProfile user, Belt newBelt) {
        if (user.getBelt() == null || newBelt.ordinal() > user.getBelt().ordinal()) {
            user.setBelt(newBelt);
            user.setStripe(0);
            userProfileRepository.save(user);
        }
    }

    @Transactional(readOnly = true)
    public Page<AcademyMemberResponse> findAll(UUID academyId, String query, Pageable pageable) {
        if (!academyRepository.existsById(academyId)) {
            throw new EntityNotFoundException("Academy not found");
        }
        if (query != null && !query.isBlank()) {
            return memberRepository.findByAcademyIdAndUserName(academyId, query, pageable)
                    .map(AcademyMemberResponse::fromEntity);
        }
        return memberRepository.findAllByAcademyId(academyId, pageable)
                .map(AcademyMemberResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public AcademyMemberResponse findById(UUID academyId, UUID userId) {
        AcademyMemberId id = new AcademyMemberId(academyId, userId);
        return memberRepository.findById(id)
                .map(AcademyMemberResponse::fromEntity)
                .orElseThrow(() -> new EntityNotFoundException("Member not found"));
    }

    @Transactional
    public void removeMember(UUID academyId, UUID userId) {
        AcademyMemberId id = new AcademyMemberId(academyId, userId);
        if (!memberRepository.existsById(id)) {
            throw new EntityNotFoundException("Member not found");
        }
        memberRepository.deleteById(id);
    }
}
