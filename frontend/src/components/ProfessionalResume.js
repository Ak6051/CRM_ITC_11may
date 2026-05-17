import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Star as StarIcon,
  Description as ResumeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

// ── Helper: format CTC value (avoid duplicate LPA/Lakh) ──
const formatCTC = (val) => {
  if (!val) return '';
  const s = String(val).trim();
  // If it already has LPA/Lakh/L etc., just prefix with ₹ if not there
  if (/lpa|lakh|lac|l$/i.test(s)) {
    return s.startsWith('₹') ? s : `₹${s}`;
  }
  // Pure number — just show ₹ + value
  return s.startsWith('₹') ? s : `₹${s}`;
};

// ═══════════════════════════════════════════════════════════════════════
// Professional Resume Preview (in-dialog HTML preview)
// ═══════════════════════════════════════════════════════════════════════
const ProfessionalResumePreview = ({ candidate }) => {
  if (!candidate) return null;

  const c = candidate;
  const initials = (c.name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const contactItems = [
    c.phoneNumber && { icon: <PhoneIcon sx={{ fontSize: 13 }} />, text: c.phoneNumber },
    c.email && { icon: <EmailIcon sx={{ fontSize: 13 }} />, text: c.email },
    c.currentLocation && { icon: <LocationIcon sx={{ fontSize: 13 }} />, text: c.currentLocation },
    c.preferredLocation && { icon: <LocationIcon sx={{ fontSize: 13 }} />, text: `Preferred: ${c.preferredLocation}` },
    c.gender && { icon: <PersonIcon sx={{ fontSize: 13 }} />, text: c.gender },
  ].filter(Boolean);

  const objective = c.remark || c.reasonforLeaving ||
    'Highly motivated professional seeking a challenging position where I can leverage my skills and experience to contribute to organizational growth while continuously developing my expertise.';

  const skills = [...new Set([c.positionName, c.currentPosition, c.industry].filter(Boolean))];
  const hasWorkExp = c.currentPosition || c.currentCompany || c.experience;

  return (
    <Box sx={{
      bgcolor: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      overflow: 'hidden',
      fontFamily: '"Segoe UI", "Roboto", "Arial", sans-serif',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      maxWidth: 800,
      mx: 'auto',
    }}>
      {/* ── HEADER ── */}
      <Box sx={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1e3a5f 100%)',
        px: 4, py: 3.5,
        display: 'flex', alignItems: 'center', gap: 3,
      }}>
        {/* Avatar circle */}
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.3)',
          bgcolor: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 1 }}>
            {initials}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{
            color: '#fff', fontWeight: 800, fontSize: 28, letterSpacing: 1.5,
            textTransform: 'uppercase', lineHeight: 1.2, mb: 0.5,
          }}>
            {c.name || 'Candidate Name'}
          </Typography>
          {(c.currentPosition || c.positionName) && (
            <Typography sx={{
              color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500,
              letterSpacing: 0.5,
            }}>
              {c.currentPosition || c.positionName}
              {c.experience && ` • ${c.experience} Experience`}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── CONTACT BAR ── */}
      {contactItems.length > 0 && (
        <Box sx={{
          bgcolor: '#f0f4f8', px: 4, py: 1.2,
          display: 'flex', flexWrap: 'wrap', gap: 2.5,
          borderBottom: '2px solid #1e3a5f',
        }}>
          {contactItems.map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ color: '#1e3a5f' }}>{item.icon}</Box>
              <Typography fontSize={12} color="#334155" fontWeight={500}>{item.text}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* ── BODY — Two column layout ── */}
      <Box sx={{ display: 'flex', minHeight: 400 }}>

        {/* LEFT COLUMN (main content) */}
        <Box sx={{ flex: 1, p: 3.5, pr: 3 }}>

          {/* Career Objective */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
              <Box sx={{ width: 4, height: 20, bgcolor: '#1e3a5f', borderRadius: 2 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Career Objective
              </Typography>
            </Box>
            <Typography fontSize={12.5} color="#475569" lineHeight={1.8} sx={{ pl: 1.5 }}>
              {objective}
            </Typography>
          </Box>

          {/* Work Experience */}
          {hasWorkExp && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                <Box sx={{ width: 4, height: 20, bgcolor: '#1e3a5f', borderRadius: 2 }} />
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Work Experience
                </Typography>
              </Box>
              <Box sx={{ pl: 1.5 }}>
                {/* Job title + company */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '8px',
                    bgcolor: '#e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, mt: 0.2,
                  }}>
                    <WorkIcon sx={{ fontSize: 16, color: '#1e3a5f' }} />
                  </Box>
                  <Box>
                    <Typography fontSize={14} fontWeight={700} color="#1e293b">
                      {c.currentPosition || 'Professional'}
                    </Typography>
                    {c.currentCompany && (
                      <Typography fontSize={12.5} color="#64748b" fontWeight={500}>
                        {c.currentCompany}
                      </Typography>
                    )}
                    {c.experience && (
                      <Typography fontSize={11.5} color="#94a3b8" mt={0.2}>
                        Total Experience: {c.experience}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* CTC & Notice info — row of detail items */}
                {(c.currentCTC || c.expectedCTC || c.noticePeriod) && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5, pl: 5.5 }}>
                    {c.currentCTC && (
                      <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', px: 1.5, py: 0.5, minWidth: 100 }}>
                        <Typography fontSize={10} color="#0369a1" fontWeight={600}>Current CTC</Typography>
                        <Typography fontSize={13} color="#0c4a6e" fontWeight={700}>{formatCTC(c.currentCTC)}</Typography>
                      </Box>
                    )}
                    {c.expectedCTC && (
                      <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', px: 1.5, py: 0.5, minWidth: 100 }}>
                        <Typography fontSize={10} color="#15803d" fontWeight={600}>Expected CTC</Typography>
                        <Typography fontSize={13} color="#14532d" fontWeight={700}>{formatCTC(c.expectedCTC)}</Typography>
                      </Box>
                    )}
                    {c.noticePeriod && (
                      <Box sx={{ bgcolor: '#fefce8', border: '1px solid #fde68a', borderRadius: '6px', px: 1.5, py: 0.5, minWidth: 80 }}>
                        <Typography fontSize={10} color="#a16207" fontWeight={600}>Notice Period</Typography>
                        <Typography fontSize={13} color="#713f12" fontWeight={700}>{c.noticePeriod}</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Reason for leaving */}
                {c.reasonforLeaving && (
                  <Box sx={{ mt: 1.5, pl: 5.5 }}>
                    <Typography fontSize={11} color="#94a3b8" fontWeight={600}>Reason for Leaving</Typography>
                    <Typography fontSize={12} color="#64748b">{c.reasonforLeaving}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* Education */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
              <Box sx={{ width: 4, height: 20, bgcolor: '#1e3a5f', borderRadius: 2 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                Education
              </Typography>
            </Box>
            <Box sx={{ pl: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                bgcolor: '#e8edf3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, mt: 0.2,
              }}>
                <SchoolIcon sx={{ fontSize: 16, color: '#1e3a5f' }} />
              </Box>
              <Box>
                <Typography fontSize={14} fontWeight={700} color="#1e293b">
                  {c.qualification || 'Graduate'}
                </Typography>
                <Typography fontSize={12} color="#94a3b8">Educational Qualification</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* RIGHT COLUMN (sidebar) */}
        <Box sx={{
          width: 220, flexShrink: 0,
          bgcolor: '#f8fafc', borderLeft: '1px solid #e2e8f0',
          p: 2.5, display: 'flex', flexDirection: 'column', gap: 3,
        }}>

          {/* Skills */}
          {skills.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                <StarIcon sx={{ fontSize: 15, color: '#1e3a5f' }} />
                <Typography fontSize={12} fontWeight={800} color="#1e3a5f" textTransform="uppercase" letterSpacing={1}>
                  Skills
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {skills.map((skill, i) => (
                  <Box key={i} sx={{
                    bgcolor: '#1e3a5f', color: '#fff',
                    px: 1.5, py: 0.6, borderRadius: '6px',
                    fontSize: 11.5, fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    {skill}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Personal Details */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
              <PersonIcon sx={{ fontSize: 15, color: '#1e3a5f' }} />
              <Typography fontSize={12} fontWeight={800} color="#1e3a5f" textTransform="uppercase" letterSpacing={1}>
                Details
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {c.gender && (
                <Box>
                  <Typography fontSize={10} color="#94a3b8" fontWeight={600}>Gender</Typography>
                  <Typography fontSize={12} color="#334155" fontWeight={600}>{c.gender}</Typography>
                </Box>
              )}
              {c.currentLocation && (
                <Box>
                  <Typography fontSize={10} color="#94a3b8" fontWeight={600}>Location</Typography>
                  <Typography fontSize={12} color="#334155" fontWeight={600}>{c.currentLocation}</Typography>
                </Box>
              )}
              {c.preferredLocation && (
                <Box>
                  <Typography fontSize={10} color="#94a3b8" fontWeight={600}>Preferred Location</Typography>
                  <Typography fontSize={12} color="#334155" fontWeight={600}>{c.preferredLocation}</Typography>
                </Box>
              )}
              {c.industry && (
                <Box>
                  <Typography fontSize={10} color="#94a3b8" fontWeight={600}>Industry</Typography>
                  <Typography fontSize={12} color="#334155" fontWeight={600}>{c.industry}</Typography>
                </Box>
              )}
              {c.noticePeriod && (
                <Box>
                  <Typography fontSize={10} color="#94a3b8" fontWeight={600}>Notice Period</Typography>
                  <Typography fontSize={12} color="#334155" fontWeight={600}>{c.noticePeriod}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Position Applied For */}
          {c.positionName && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                <WorkIcon sx={{ fontSize: 15, color: '#1e3a5f' }} />
                <Typography fontSize={12} fontWeight={800} color="#1e3a5f" textTransform="uppercase" letterSpacing={1}>
                  Applied For
                </Typography>
              </Box>
              <Box sx={{
                bgcolor: '#e0e7ff', border: '1px solid #c7d2fe',
                borderRadius: '8px', px: 1.5, py: 1,
              }}>
                <Typography fontSize={12} fontWeight={700} color="#3730a3">{c.positionName}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── FOOTER ── */}
      <Box sx={{
        bgcolor: '#1e3a5f', px: 4, py: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Typography fontSize={10} color="rgba(255,255,255,0.6)" fontStyle="italic">
          This resume is generated by iTalentConnect from candidate's profile data
        </Typography>
        <Typography fontSize={10} color="rgba(255,255,255,0.4)">
          iTalentConnect
        </Typography>
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Professional PDF Download (using jsPDF)
// ═══════════════════════════════════════════════════════════════════════
const generateProfessionalCV = async (candidate) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();   // 595
  const H = doc.internal.pageSize.getHeight();  // 842
  const c = candidate;

  // ── Colors ──
  const navy    = [30, 58, 95];      // #1e3a5f
  const darkText = [30, 41, 59];     // #1e293b
  const grayText = [71, 85, 105];    // #475569
  const lightGray = [148, 163, 184]; // #94a3b8
  const white    = [255, 255, 255];
  const bgLight  = [240, 244, 248];  // #f0f4f8

  // ── Layout ──
  const ml = 40;  // main left margin
  const sidebarX = 400;  // sidebar start
  const sidebarW = W - sidebarX;
  const contentW = sidebarX - ml - 20;  // main content width

  let y = 0;

  // ═══ HEADER BAR ═══
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 90, 'F');

  // Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...white);
  const nameText = (c.name || 'CANDIDATE NAME').toUpperCase();
  // Truncate if too long for header
  const nameLines = doc.splitTextToSize(nameText, sidebarX - ml - 20);
  doc.text(nameLines[0], ml + 10, 38);

  // Title line
  const titleParts = [c.currentPosition, c.experience ? `${c.experience} Experience` : null].filter(Boolean);
  if (titleParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(200, 210, 230);
    doc.text(titleParts.join('  •  '), ml + 10, 58);
  }

  // Contact line
  const contactParts = [c.phoneNumber, c.email, c.currentLocation, c.gender].filter(Boolean);
  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(180, 195, 215);
    const contactLine = contactParts.join('   |   ');
    const contactLines = doc.splitTextToSize(contactLine, sidebarX - ml - 20);
    doc.text(contactLines[0], ml + 10, 76);
  }

  y = 105;

  // ── Helper: Section heading ──
  const sectionHeading = (title, startY) => {
    doc.setFillColor(...navy);
    doc.rect(ml, startY, 4, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...navy);
    doc.text(title.toUpperCase(), ml + 12, startY + 12);
    return startY + 26;
  };

  // ── Helper: wrapped text ──
  const wrappedText = (text, x, startY, maxW, fontSize = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...grayText);
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text(lines, x, startY);
    return startY + lines.length * (fontSize + 4);
  };

  // ═══ CAREER OBJECTIVE ═══
  const objective = c.remark || c.reasonforLeaving ||
    'Highly motivated professional seeking a challenging position where I can leverage my skills and experience to contribute to organizational growth while continuously developing my expertise.';

  y = sectionHeading('Career Objective', y);
  y = wrappedText(objective, ml + 12, y, contentW);
  y += 12;

  // ═══ WORK EXPERIENCE ═══
  if (c.currentPosition || c.currentCompany || c.experience) {
    y = sectionHeading('Work Experience', y);
    const expX = ml + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...darkText);
    doc.text(c.currentPosition || 'Professional', expX, y);
    y += 15;

    if (c.currentCompany) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...grayText);
      doc.text(c.currentCompany, expX, y);
      y += 14;
    }

    if (c.experience) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(...lightGray);
      doc.text(`Total Experience: ${c.experience}`, expX, y);
      y += 18;
    }

    // CTC & Notice — as labeled lines instead of boxes (cleaner, no overflow)
    const infoItems = [
      c.currentCTC && { label: 'Current CTC:', value: formatCTC(c.currentCTC) },
      c.expectedCTC && { label: 'Expected CTC:', value: formatCTC(c.expectedCTC) },
      c.noticePeriod && { label: 'Notice Period:', value: String(c.noticePeriod) },
    ].filter(Boolean);

    if (infoItems.length > 0) {
      infoItems.forEach((item) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...lightGray);
        doc.text(item.label, expX + 10, y);
        const labelW = doc.getTextWidth(item.label);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...darkText);
        doc.text(item.value, expX + 10 + labelW + 6, y);
        y += 16;
      });
      y += 4;
    }

    if (c.reasonforLeaving) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...lightGray);
      doc.text('Reason for Leaving:', expX, y);
      y += 12;
      doc.setFontSize(9);
      doc.setTextColor(...grayText);
      const rlLines = doc.splitTextToSize(c.reasonforLeaving, contentW - 12);
      doc.text(rlLines, expX, y);
      y += rlLines.length * 13;
    }

    y += 12;
  }

  // ═══ EDUCATION ═══
  y = sectionHeading('Education', y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkText);
  doc.text(c.qualification || 'Graduate', ml + 12, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.text('Educational Qualification', ml + 12, y);
  y += 20;

  // ═══ SIDEBAR (right column) ═══
  // Sidebar background
  doc.setFillColor(248, 250, 252);
  doc.rect(sidebarX, 90, sidebarW, H - 90 - 30, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(sidebarX, 90, sidebarX, H - 30);

  let sy = 110;
  const sx = sidebarX + 16;
  const sContentW = sidebarW - 32;

  // Skills section — deduplicate
  const skills = [...new Set([c.positionName, c.currentPosition, c.industry].filter(Boolean))];
  if (skills.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text('SKILLS', sx, sy);
    sy += 16;

    skills.forEach(skill => {
      doc.setFillColor(...navy);
      doc.roundedRect(sx, sy - 10, sContentW, 20, 4, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...white);
      // Truncate skill text if too wide
      const skillText = doc.splitTextToSize(skill, sContentW - 16);
      doc.text(skillText[0], sx + 8, sy + 3);
      sy += 26;
    });
    sy += 8;
  }

  // Personal Details section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...navy);
  doc.text('PERSONAL DETAILS', sx, sy);
  sy += 16;

  const details = [
    c.gender && ['Gender', c.gender],
    c.currentLocation && ['Location', c.currentLocation],
    c.preferredLocation && ['Preferred Location', c.preferredLocation],
    c.industry && ['Industry', c.industry],
    c.noticePeriod && ['Notice Period', String(c.noticePeriod)],
  ].filter(Boolean);

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text(label, sx, sy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkText);
    // Wrap value if too long for sidebar
    const valLines = doc.splitTextToSize(String(value), sContentW);
    doc.text(valLines[0], sx, sy + 12);
    sy += 28;
  });

  // Applied For section
  if (c.positionName) {
    sy += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...navy);
    doc.text('APPLIED FOR', sx, sy);
    sy += 16;
    doc.setFillColor(224, 231, 255);
    doc.roundedRect(sx, sy - 10, sContentW, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(55, 48, 163);
    const posText = doc.splitTextToSize(c.positionName, sContentW - 16);
    doc.text(posText[0], sx + 8, sy + 5);
  }

  // ═══ FOOTER ═══
  doc.setFillColor(...navy);
  doc.rect(0, H - 30, W, 30, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(180, 195, 215);
  doc.text('This resume is generated by iTalentConnect from candidate\'s profile data', ml, H - 12);
  doc.setTextColor(140, 155, 175);
  doc.text('iTalentConnect', W - ml - doc.getTextWidth('iTalentConnect'), H - 12);

  doc.save(`${(c.name || 'candidate').replace(/\s+/g, '_')}_Resume.pdf`);
};

export { ProfessionalResumePreview, generateProfessionalCV };
export default ProfessionalResumePreview;
