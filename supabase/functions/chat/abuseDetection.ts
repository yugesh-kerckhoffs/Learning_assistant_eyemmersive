// ==========================================
// Abuse Detection Module
// Detects concerning messages from children and logs safety alerts
// ==========================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Abuse detection keywords organized by severity
const HIGH_SEVERITY_KEYWORDS = [
  'abuse', 'abused', 'molest', 'rape', 'raped', 'sexual',
  'touched me', 'touch me inappropriately', 'inappropriate touch',
  'kill me', 'kill myself', 'want to die', 'suicide',
  'beaten', 'beat me', 'beats me',
];

const MEDIUM_SEVERITY_KEYWORDS = [
  'hit me', 'hits me', 'hurt me', 'hurts me',
  'punch', 'punched', 'kick', 'kicked',
  'slap', 'slapped', 'scared of', 'afraid of', 'frightened',
  'bully', 'bullied', 'bullying', 'harass', 'harassed', 'harassment',
  'uncomfortable', 'secret', "don't tell", 'nobody knows',
  'violence', 'violent', 'yell at me', 'yells at me', 'scream at me',
  'screams at me', 'threatens me', 'threatened',
];

const LOW_SEVERITY_KEYWORDS = [
  'hurt', 'pain', 'sad', 'crying', 'lonely',
  'no friends', 'left out', 'ignored', 'mean to me',
  'makes fun of me', 'laughs at me', 'teases me',
  'not safe', 'unsafe', 'worried', 'nervous',
];

export interface AbuseDetectionResult {
  isConcerning: boolean;
  severityLevel: 'high' | 'medium' | 'low';
  detectionMethod: 'keyword' | 'ai_analysis';
  foundKeywords: string[];
}

// Detect abuse keywords and determine severity
export function detectAbuse(message: string): AbuseDetectionResult {
  const lowerMessage = message.toLowerCase();

  // Check HIGH severity first
  const highMatches = HIGH_SEVERITY_KEYWORDS.filter(k => lowerMessage.includes(k));
  if (highMatches.length > 0) {
    return { isConcerning: true, severityLevel: 'high', detectionMethod: 'keyword', foundKeywords: highMatches };
  }

  // Check MEDIUM severity
  const mediumMatches = MEDIUM_SEVERITY_KEYWORDS.filter(k => lowerMessage.includes(k));
  if (mediumMatches.length > 0) {
    return { isConcerning: true, severityLevel: 'medium', detectionMethod: 'keyword', foundKeywords: mediumMatches };
  }

  // Check LOW severity
  const lowMatches = LOW_SEVERITY_KEYWORDS.filter(k => lowerMessage.includes(k));
  if (lowMatches.length > 0) {
    return { isConcerning: true, severityLevel: 'low', detectionMethod: 'keyword', foundKeywords: lowMatches };
  }

  return { isConcerning: false, severityLevel: 'low', detectionMethod: 'keyword', foundKeywords: [] };
}

// AI-based abuse analysis for deeper detection
export async function analyzeWithAI(apiKey: string, message: string): Promise<AbuseDetectionResult | null> {
  try {
    const analysisPrompt = `You are a child safety expert. Analyze this message from a child and determine if it contains ANY signs of:
- Physical abuse or violence
- Emotional abuse or bullying  
- Sexual abuse or inappropriate contact
- Neglect or unsafe situations
- Threats or intimidation
- Self-harm or suicidal thoughts

Message: "${message}"

Respond with ONLY a JSON object (no markdown, no backticks):
{
  "is_concerning": true/false,
  "severity": "low" or "medium" or "high",
  "reason": "brief explanation",
  "detected_issues": ["list", "of", "issues"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 300 },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) return null;

    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.is_concerning) {
      return {
        isConcerning: true,
        severityLevel: parsed.severity || 'medium',
        detectionMethod: 'ai_analysis',
        foundKeywords: parsed.detected_issues || [],
      };
    }
    return null;
  } catch (e) {
    console.error('AI abuse analysis error:', e);
    return null;
  }
}

// Collect all emails associated with a student (user email, teacher, principal, counselor)
async function collectEmails(
  extDb: any,
  userEmail: string | null,
  userId: string | null
): Promise<string[]> {
  const emails: string[] = [];

  if (userEmail) emails.push(userEmail);

  if (!extDb || !userId) return emails;

  try {
    // Get user profile to find school and teacher
    const { data: profile, error: profileError } = await extDb
      .from('profiles')
      .select('school_id, assigned_teacher_id')
      .eq('id', userId)
      .single();

    console.log(`📋 Profile lookup for ${userId}:`, JSON.stringify(profile), 'error:', profileError);

    if (!profile) return emails;

    // Get teacher email
    if (profile.assigned_teacher_id) {
      const { data: teacher, error: teacherError } = await extDb
        .from('teachers')
        .select('teacher_email')
        .eq('id', profile.assigned_teacher_id)
        .single();
      console.log(`👩‍🏫 Teacher lookup:`, JSON.stringify(teacher), 'error:', teacherError);
      if (teacher?.teacher_email) emails.push(teacher.teacher_email);
    }

    // Get school emails (principal + counselor)
    if (profile.school_id) {
      const { data: school, error: schoolError } = await extDb
        .from('schools')
        .select('principal_email, counselor_email')
        .eq('id', profile.school_id)
        .single();
      console.log(`🏫 School lookup:`, JSON.stringify(school), 'error:', schoolError);
      if (school?.principal_email) emails.push(school.principal_email);
      if (school?.counselor_email) emails.push(school.counselor_email);
    }
  } catch (e) {
    console.error('Error collecting emails:', e);
  }

  // Deduplicate
  return [...new Set(emails)];
}

// Log safety alert to database with emails_to_notify
export async function logSafetyAlert(
  extDb: any,
  userId: string | null,
  userEmail: string | null,
  message: string,
  detectionResult: AbuseDetectionResult
): Promise<void> {
  if (!extDb) {
    console.error('No external DB connection for safety alert');
    return;
  }

  try {
    const emailsToNotify = await collectEmails(extDb, userEmail, userId);

    await extDb.from('safety_alerts').insert({
      user_id: userId,
      flagged_message: message,
      detection_method: detectionResult.detectionMethod,
      severity_level: detectionResult.severityLevel,
      emails_to_notify: emailsToNotify,
    });

    console.log(`✅ Safety alert logged: severity=${detectionResult.severityLevel}, emails=${emailsToNotify.length}`);
  } catch (e) {
    console.error('Error logging safety alert:', e);
  }
}

// Main function: run abuse detection pipeline
export async function runAbuseDetection(
  apiKey: string,
  extDb: any,
  userId: string | null,
  userEmail: string | null,
  message: string
): Promise<AbuseDetectionResult | null> {
  // Step 1: Keyword detection
  const keywordResult = detectAbuse(message);

  if (keywordResult.isConcerning) {
    // Log immediately
    await logSafetyAlert(extDb, userId, userEmail, message, keywordResult);
    return keywordResult;
  }

  // Step 2: AI analysis for messages not caught by keywords
  const aiResult = await analyzeWithAI(apiKey, message);

  if (aiResult && aiResult.isConcerning) {
    await logSafetyAlert(extDb, userId, userEmail, message, aiResult);
    return aiResult;
  }

  return null;
}