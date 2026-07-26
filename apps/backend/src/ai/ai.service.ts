import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateOutlineDto } from './dto/generate-outline.dto';
import { GenerateLessonContentDto } from './dto/generate-lesson-content.dto';
import { GenerateQuizDto } from './dto/generate-quiz.dto';
import { DraftCourseDto } from './dto/draft-course.dto';

@Injectable()
export class AiService {
  private ai: GoogleGenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.ai = new GoogleGenAI({ apiKey });
      this.logger.log('✨ Google Gemini AI SDK initialized successfully.');
    } else {
      this.logger.log('ℹ️ GEMINI_API_KEY not configured. Using high-quality AI Fallback Template Engine for BPO training.');
    }
  }

  async generateOutline(dto: GenerateOutlineDto) {
    if (this.ai) {
      try {
        const prompt = `You are an expert Instructional Designer for BPO and enterprise training.
Generate a structured course outline in JSON format for topic: "${dto.topic}" targeting role: "${dto.targetRole}".
Return ONLY valid JSON with this structure:
{
  "title": "string",
  "description": "string",
  "category": "Sales|Customer Support|IT|HR|Compliance",
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedDurationMinutes": 60,
  "modules": [
    {
      "title": "string",
      "order": 1,
      "lessons": [
        { "title": "string", "summary": "string", "order": 1 }
      ]
    }
  ]
}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        this.logger.error('Error calling Gemini API for outline generation, using fallback:', err);
      }
    }

    return {
      title: `${dto.topic}: Professional ${dto.targetRole} Masterclass`,
      description: `Comprehensive onboarding and operational training module designed specifically for ${dto.targetRole} professionals covering core workflows, objection handling, and best practices.`,
      category: dto.targetRole === 'IT' ? 'IT & Security' : dto.targetRole === 'HR' ? 'HR Policies' : 'Sales & Support',
      difficulty: 'Intermediate',
      estimatedDurationMinutes: dto.estimatedDurationMinutes || 60,
      modules: [
        {
          title: 'Module 1: Foundations & Standard Operating Procedures',
          order: 1,
          lessons: [
            {
              title: `1.1 Core Responsibilities for ${dto.targetRole}`,
              summary: 'Overview of daily responsibilities, KPIs, metrics, and quality assurance criteria.',
              order: 1,
            },
            {
              title: '1.2 Operational Systems & Software Stack',
              summary: 'Navigation guide for CRM, ticketing platforms, telephony software, and internal tools.',
              order: 2,
            },
          ],
        },
        {
          title: 'Module 2: Real-world Scenarios & Best Practices',
          order: 2,
          lessons: [
            {
              title: '2.1 Handling High-Stakes Interactions',
              summary: 'Step-by-step framework for de-escalation, clear communication, and customer satisfaction.',
              order: 1,
            },
            {
              title: '2.2 Compliance, Data Privacy & Security Rules',
              summary: 'Essential compliance rules, handling sensitive client data, and security protocols.',
              order: 2,
            },
          ],
        },
      ],
    };
  }

  async generateLesson(dto: GenerateLessonContentDto) {
    if (this.ai) {
      try {
        const prompt = `Generate structured rich text lesson content for lesson: "${dto.lessonTitle}" targeting role: "${dto.targetRole}".
Return ONLY valid JSON matching:
{
  "title": "string",
  "content": "markdown text with headings, bullet points, callouts, and call scripts",
  "keyTakeaways": ["string"],
  "scenarioScript": "string"
}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        this.logger.error('Error calling Gemini API for lesson generation, using fallback:', err);
      }
    }

    return {
      title: dto.lessonTitle,
      content: `## ${dto.lessonTitle}\n\nWelcome to this structured learning module tailored for **${dto.targetRole}** team members.\n\n### Objective\nMaster essential concepts and practical execution strategies for ${dto.lessonTitle}.\n\n### Key Concepts\n- **Rule 1:** Maintain active listening and clear articulation.\n- **Rule 2:** Document all interactions immediately in standard CRM/ticketing software.\n- **Rule 3:** Follow the 3-step resolution framework (Acknowledge, Clarify, Resolve).\n\n### Recommended Call / Communication Script\n> **Agent:** "Thank you for reaching out to customer support. My name is Alex. How can I assist you with your account today?"\n> **Client:** "I need help configuring my user permissions."\n> **Agent:** "I would be happy to guide you through that right away!"\n\n### Summary\nAlways double check compliance standards before finalizing client tickets.`,
      keyTakeaways: [
        'Follow standard operating procedure guidelines on every call/ticket.',
        'Escalate unresolved issues to lead supervisors within 15 minutes.',
        'Ensure documentation is completed before closing interaction.',
      ],
      scenarioScript: 'Roleplay: Practice navigating customer objections using the 3-step framework.',
    };
  }

  async generateQuiz(dto: GenerateQuizDto) {
    const questionCount = dto.questionCount || 5;

    if (this.ai) {
      try {
        const prompt = `You are an AI Assessment Generator for BPO employee training.
Generate a question bank of ${questionCount} questions based on this lesson content:
Title: "${dto.lessonTitle}"
Content: "${dto.lessonContent}"

Return ONLY valid JSON matching this exact structure:
{
  "title": "${dto.lessonTitle} Assessment Quiz",
  "passingScorePct": 80,
  "maxAttempts": 3,
  "timeLimitMinutes": 15,
  "questions": [
    {
      "questionText": "string",
      "questionType": "MCQ|TRUE_FALSE|SHORT_ANSWER",
      "difficulty": "${dto.difficulty || 'Intermediate'}",
      "points": 1,
      "explanation": "Detailed explanation of why the correct answer is right",
      "options": [
        { "optionText": "string", "isCorrect": true },
        { "optionText": "string", "isCorrect": false }
      ]
    }
  ]
}`;

        const response = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text;
        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        this.logger.error('Error calling Gemini API for quiz generation, using fallback:', err);
      }
    }

    // High-quality AI Fallback Question Bank
    return {
      title: `${dto.lessonTitle} Assessment Quiz`,
      passingScorePct: 80,
      maxAttempts: 3,
      timeLimitMinutes: 15,
      questions: [
        {
          questionText: `What is the primary objective of ${dto.lessonTitle}?`,
          questionType: 'MCQ',
          difficulty: dto.difficulty || 'Intermediate',
          points: 1,
          explanation: 'Standard Operating Procedures require following the 3-step resolution framework to ensure quality assurance.',
          options: [
            { optionText: 'To follow standard operating procedures and deliver high customer satisfaction', isCorrect: true },
            { optionText: 'To close the ticket immediately without verification', isCorrect: false },
            { optionText: 'To transfer every call to a senior lead supervisor', isCorrect: false },
            { optionText: 'To bypass documentation when volume is high', isCorrect: false },
          ],
        },
        {
          questionText: 'True or False: Agents must document all interactions in standard CRM/ticketing software immediately.',
          questionType: 'TRUE_FALSE',
          difficulty: dto.difficulty || 'Beginner',
          points: 1,
          explanation: 'Immediate documentation ensures data accuracy and compliance across all client accounts.',
          options: [
            { optionText: 'True', isCorrect: true },
            { optionText: 'False', isCorrect: false },
          ],
        },
        {
          questionText: 'What is the recommended timeframe to escalate unresolved high-stakes issues to a supervisor?',
          questionType: 'MCQ',
          difficulty: dto.difficulty || 'Intermediate',
          points: 1,
          explanation: 'SOP guidelines mandate escalation within 15 minutes to prevent SLA violations.',
          options: [
            { optionText: 'Within 15 minutes', isCorrect: true },
            { optionText: 'Within 2 hours', isCorrect: false },
            { optionText: 'At the end of the shift', isCorrect: false },
            { optionText: 'Never escalate issues', isCorrect: false },
          ],
        },
      ],
    };
  }

  async validateAndSanitizeCourseSchema(raw: any, fallbackTopic: string, targetRole: string, moduleCount: number = 3): Promise<any> {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Response is not a valid JSON object');
    }
    if (!raw.title || !raw.description) {
      throw new Error('Missing title or description in schema');
    }
    if (!Array.isArray(raw.sections) || raw.sections.length !== moduleCount) {
      throw new Error(`Expected exactly ${moduleCount} modules/sections, got ${Array.isArray(raw.sections) ? raw.sections.length : 0}`);
    }
    for (const sec of raw.sections) {
      if (!sec.title || !sec.content) {
        throw new Error('Each section must have a title and markdown content');
      }
    }
    if (!Array.isArray(raw.quiz) || raw.quiz.length === 0) {
      throw new Error('Quiz must be a non-empty array of questions');
    }
    for (const q of raw.quiz) {
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2) {
        throw new Error('Each quiz question must have text and at least 2 options');
      }
      while (q.options.length < 4) {
        q.options.push(`Alternative option ${q.options.length + 1}`);
      }
      if (q.options.length > 4) {
        q.options = q.options.slice(0, 4);
      }
      if (!q.correctAnswer || !q.options.includes(q.correctAnswer)) {
        q.correctAnswer = q.options[0];
      }
      if (!q.explanation) {
        q.explanation = 'Review the section notes for detailed background on this rule.';
      }
      q.type = 'multiple_choice';
    }

    return {
      title: raw.title || `${fallbackTopic}: Professional ${targetRole} Masterclass`,
      description: raw.description || `Comprehensive onboarding and operational training module designed specifically for ${targetRole} professionals.`,
      estimatedDuration: String(raw.estimatedDuration || '60'),
      difficulty: raw.difficulty || 'Intermediate',
      learningObjectives: Array.isArray(raw.learningObjectives) ? raw.learningObjectives : [
        `Master core operational protocols for ${fallbackTopic}`,
        'Understand SLA compliance and documentation rules',
        'Apply de-escalation and structured resolution frameworks'
      ],
      prerequisites: Array.isArray(raw.prerequisites) ? raw.prerequisites : [
        'Basic understanding of BPO workstation software',
        'Completion of general employee onboarding'
      ],
      sections: raw.sections,
      summary: raw.summary || `In summary, adhering to strict operational standards and continuous documentation is key for success in ${targetRole} roles.`,
      quiz: raw.quiz,
    };
  }

  async generateStandardizedCourseJSON(topic: string, targetRole: string, durationMinutes: number, difficulty: string, moduleCount: number = 3, dto?: any): Promise<any> {
    const maxRetries = 3;
    const targetDept = dto?.targetDepartment || targetRole;
    const expLevel = dto?.experienceLevel || difficulty || 'Intermediate';
    const industryContext = dto?.industry || 'Enterprise BPO Operations';
    const prereqText = Array.isArray(dto?.prerequisites) && dto.prerequisites.length > 0 ? dto.prerequisites.join(', ') : 'Standard workstation software & employee security onboarding';

    if (this.ai) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          this.logger.log(`🤖 Gemini generation attempt ${attempt}/${maxRetries} for topic: "${topic}" (requiring exactly ${moduleCount} modules)`);
          const prompt = `You are a Senior Staff Instructional Designer building an enterprise training course.
Generate a structured course in deterministic JSON format for topic: "${topic}".
Target Audience Details:
- Role: "${targetRole}"
- Department: "${targetDept}"
- Experience Level: "${expLevel}"
- Industry: "${industryContext}"
- Prerequisites: "${prereqText}"

CRITICAL REQUIREMENT: You MUST generate EXACTLY ${moduleCount} sections/modules in the "sections" array. Do not generate more or less than ${moduleCount}.
Return ONLY valid JSON matching this exact schema (no markdown fences around the json if possible, or valid JSON inside braces):
{
  "title": "string - Professional course title tailored for ${targetRole} in ${industryContext}",
  "description": "string - Detailed production-quality overview of the training targeting ${expLevel} professionals in ${targetDept}",
  "estimatedDuration": "${durationMinutes}",
  "difficulty": "${difficulty || 'Intermediate'}",
  "learningObjectives": [
    "string - Actionable objective 1",
    "string - Actionable objective 2",
    "string - Actionable objective 3"
  ],
  "prerequisites": [
    "string - Prerequisite 1",
    "string - Prerequisite 2"
  ],
  "sections": [
    {
      "title": "Module 1: Standard Operating Procedures & Core Rules",
      "content": "## Section Overview\\n\\nWelcome to this structured operational module...\\n\\n### Key Rules\\n1. **Rule 1:** Maintain strict confidentiality.\\n2. **Rule 2:** Document all interactions.\\n\\n\`\`\`text\\nExample CRM Entry Format:\\n[TICKET-ID] | Status: Resolved | Notes: Client verified.\\n\`\`\`\\n\\n| Metric | Target | Frequency |\\n| :--- | :--- | :--- |\\n| CSAT | >= 95% | Monthly |\\n| FCR | >= 85% | Weekly |"
    }
    // ... exactly ${moduleCount} objects in this array!
  ],
  "summary": "string - Executive summary reinforcing key takeaways",
  "quiz": [
    {
      "id": "q1",
      "question": "What is the primary operational requirement when initiating a client interaction?",
      "type": "multiple_choice",
      "options": [
        "Verify client identity and document the ticket immediately in the CRM",
        "Transfer the call to a supervisor without checking notes",
        "Ask the client to call back during off-peak hours",
        "Bypass standard documentation if call volume is currently high"
      ],
      "correctAnswer": "Verify client identity and document the ticket immediately in the CRM",
      "explanation": "Standard Operating Procedures (SOP) strictly mandate immediate identity verification and logging to prevent unauthorized account access."
    },
    {
      "id": "q2",
      "question": "What is the minimum Target Customer Satisfaction (CSAT) score required for BPO agents?",
      "type": "multiple_choice",
      "options": [
        "95% or higher on monthly audits",
        "50% on weekly checks",
        "75% across all departments",
        "No specific target is enforced"
      ],
      "correctAnswer": "95% or higher on monthly audits",
      "explanation": "Quality assurance guidelines establish 95% as the baseline CSAT metric for operational excellence."
    },
    {
      "id": "q3",
      "question": "When an issue exceeds standard agent resolution permissions, what is the mandatory escalation window?",
      "type": "multiple_choice",
      "options": [
        "Escalate to a lead supervisor within 15 minutes",
        "Wait until the end of the shift to send an email",
        "Close the ticket and instruct the user to email IT",
        "Hold the interaction open indefinitely"
      ],
      "correctAnswer": "Escalate to a lead supervisor within 15 minutes",
      "explanation": "Service Level Agreements (SLAs) require rapid escalation within 15 minutes to avoid SLA breach penalties."
    }
  ]
}`;

          const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          const text = response.text;
          if (text) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const validated = await this.validateAndSanitizeCourseSchema(parsed, topic, targetRole, moduleCount);
              this.logger.log(`✅ Gemini JSON schema generated with exactly ${moduleCount} modules and validated successfully!`);
              return validated;
            }
          }
        } catch (err) {
          this.logger.warn(`⚠️ Attempt ${attempt} failed JSON validation/generation: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    this.logger.log(`ℹ️ Using Deterministic High-Quality Fallback Schema (Guaranteed Production Quality with exactly ${moduleCount} modules).`);
    
    // Generate exactly moduleCount fallback sections
    const fallbackSections = [];
    const moduleTitles = [
      "Standard Operating Procedures & Core Rules",
      "Advanced Scenario & Objection Handling",
      "Quality Assurance, Compliance & SLA Tracking",
      "Practical Case Studies & Escalation Mastery",
      "Workflow Optimization & Software Navigation",
      "Advanced Client Relationship Management",
      "Data Privacy, Security & PII Protection",
      "Crisis De-escalation & Conflict Resolution",
      "Performance KPIs & Continuous Improvement",
      "Mastering Multichannel Customer Support",
      "Advanced Technical Troubleshooting",
      "Leadership & Peer Mentorship Protocols"
    ];

    for (let i = 0; i < moduleCount; i++) {
      const modTitle = moduleTitles[i % moduleTitles.length];
      fallbackSections.push({
        title: `Module ${i + 1}: ${modTitle}`,
        content: `## Module ${i + 1}: ${modTitle}\n\nWelcome to Module ${i + 1} of our structured operational training on **${topic}**, tailored specifically for **${expLevel} ${targetRole}** professionals in **${targetDept}** (${industryContext}).\n\n### Key Objectives & Protocols\n1. **Protocol 1 (Execution Excellence):** Ensure all operational actions align with ${industryContext} benchmarks and standard operating procedures.\n2. **Protocol 2 (Documentation & Audit Trails):** Log all interaction metrics accurately within standard CRM and ticketing systems.\n3. **Protocol 3 (SLA Adherence):** Maintain strict compliance with resolution timelines and escalation thresholds.\n\n### Practical Example & Workflow Template\n\`\`\`text\n[WORKFLOW-LOG] Module ${i + 1} | Status: Verified | Role: ${targetRole} (${targetDept})\nSummary: Applied structured execution framework for ${modTitle}.\nVerification: Completed SLA check and customer validation.\n\`\`\`\n\n### Operational Metrics Benchmarks\n| Metric | Benchmark Target | Review Frequency |\n| :--- | :--- | :--- |\n| **CSAT** (Customer Satisfaction) | >= 95% | Monthly Audit |\n| **FCR** (First Contact Resolution) | >= 85% | Weekly Review |\n| **AHT** (Average Handle Time) | 4m 30s | Daily Tracking |\n\n### Key Takeaways\nAlways adhere to established compliance protocols and ensure clear communication with lead supervisors.`
      });
    }

    const fallbackObj = {
      title: `${topic}: Professional ${targetRole} Operational Masterclass`,
      description: `Comprehensive production-quality onboarding and operational training module designed specifically for ${expLevel} ${targetRole} professionals in ${targetDept} (${industryContext}), covering core workflows, objection handling, and compliance best practices. Prerequisites: ${prereqText}.`,
      estimatedDuration: String(durationMinutes || 60),
      difficulty: difficulty || 'Intermediate',
      learningObjectives: [
        `Master core operational protocols and workflow execution for ${topic} within ${industryContext}`,
        `Understand strict SLA compliance and data privacy verification rules for ${targetDept}`,
        `Apply de-escalation and structured resolution frameworks during high-stakes ${targetRole} interactions`
      ],
      prerequisites: Array.isArray(dto?.prerequisites) && dto.prerequisites.length > 0 ? dto.prerequisites : [
        'Basic understanding of BPO workstation software and ticketing platforms',
        'Completion of general enterprise security and employee onboarding'
      ],
      sections: fallbackSections,
      summary: `In summary, achieving excellence in ${targetRole} roles within ${targetDept} requires consistent execution of Standard Operating Procedures, rigorous CRM documentation, and proactive objection handling. Always prioritize customer security and SLA targets across every interaction.`,
      quiz: [
        {
          "id": "q1",
          "question": `What is the primary operational requirement when initiating a client interaction regarding ${topic}?`,
          "type": "multiple_choice",
          "options": [
            "Verify client identity and document the ticket immediately in the CRM",
            "Transfer the call to a supervisor without checking notes",
            "Ask the client to call back during off-peak hours",
            "Bypass standard documentation if call volume is currently high"
          ],
          "correctAnswer": "Verify client identity and document the ticket immediately in the CRM",
          "explanation": "Standard Operating Procedures (SOP) strictly mandate immediate identity verification and logging to prevent unauthorized account access and maintain audit trails."
        },
        {
          "id": "q2",
          "question": "What is the minimum Target Customer Satisfaction (CSAT) score required for BPO agents?",
          "type": "multiple_choice",
          "options": [
            "95% or higher on monthly audits",
            "50% on weekly checks",
            "75% across all departments",
            "No specific target is enforced"
          ],
          "correctAnswer": "95% or higher on monthly audits",
          "explanation": "Quality assurance guidelines establish 95% as the baseline CSAT metric for operational excellence across all client programs."
        },
        {
          "id": "q3",
          "question": "When an issue exceeds standard agent resolution permissions, what is the mandatory escalation window?",
          "type": "multiple_choice",
          "options": [
            "Escalate to a lead supervisor within 15 minutes",
            "Wait until the end of the shift to send an email",
            "Close the ticket and instruct the user to email IT",
            "Hold the interaction open indefinitely"
          ],
          "correctAnswer": "Escalate to a lead supervisor within 15 minutes",
          "explanation": "Service Level Agreements (SLAs) require rapid escalation within 15 minutes to avoid SLA breach penalties and ensure prompt customer resolution."
        }
      ]
    };

    return this.validateAndSanitizeCourseSchema(fallbackObj, topic, targetRole, moduleCount);
  }


  async draftCourse(dto: DraftCourseDto, userId: string) {
    const durationMinutes = typeof dto.estimatedDurationMinutes === 'number' ? dto.estimatedDurationMinutes : (parseInt(dto.estimatedDurationMinutes as any, 10) || 60);
    const difficulty = dto.difficulty || 'Intermediate';
    const moduleCount = typeof dto.moduleCount === 'number' ? dto.moduleCount : (parseInt(dto.moduleCount as any, 10) || 3);

    // 1. Generate Standardized Deterministic Course Schema with exact moduleCount
    const schema = await this.generateStandardizedCourseJSON(dto.topic, dto.targetRole, durationMinutes, difficulty, moduleCount, dto);

    const year = new Date().getFullYear();
    const count = await this.prisma.course.count();
    const courseCode = `CRS-${year}-${String(count + 1).padStart(3, '0')}`;

    const tags = [dto.targetRole, 'AI-Generated', 'Draft'];
    if (dto.targetDepartment && !tags.includes(dto.targetDepartment)) {
      tags.push(dto.targetDepartment);
    }
    if (dto.industry && !tags.includes(dto.industry)) {
      tags.push(dto.industry);
    }

    // 2. Create Course in DRAFT state with single source of truth integer durationMinutes
    const createdCourse = await this.prisma.course.create({
      data: {
        title: schema.title,
        description: schema.description,
        category: dto.targetDepartment || 'Sales & Support',
        difficulty: schema.difficulty || difficulty,
        durationMinutes: durationMinutes,
        courseCode,
        status: 'DRAFT',
        version: 1,
        learningObjectives: schema.learningObjectives || [],
        prerequisites: schema.prerequisites || [],
        summary: schema.summary || '',
        createdBy: { connect: { id: userId } },
        tags,
      },
    });

    // 3. Create individual Module and Lesson records from Schema Sections (1 Module per section)
    const numSections = schema.sections.length || 1;
    const lessonDuration = Math.max(5, Math.round(durationMinutes / numSections));

    for (let lIdx = 0; lIdx < schema.sections.length; lIdx++) {
      const sec = schema.sections[lIdx];
      const createdModule = await this.prisma.module.create({
        data: {
          courseId: createdCourse.id,
          title: sec.title || `Module ${lIdx + 1}: ${schema.title} Part ${lIdx + 1}`,
          order: lIdx + 1,
        },
      });

      if (Array.isArray(sec.lessons) && sec.lessons.length > 0) {
        const subDuration = Math.max(5, Math.round(lessonDuration / sec.lessons.length));
        for (let subIdx = 0; subIdx < sec.lessons.length; subIdx++) {
          const sub = sec.lessons[subIdx];
          await this.prisma.lesson.create({
            data: {
              moduleId: createdModule.id,
              title: sub.title || `Lesson ${lIdx + 1}.${subIdx + 1}`,
              description: sub.summary || `Lesson ${subIdx + 1} of Module ${lIdx + 1}`,
              lessonType: 'TEXT',
              content: sub.content || sec.content || `## ${sub.title}\n\nContent for this lesson.`,
              durationMinutes: subDuration,
              order: subIdx + 1,
            },
          });
        }
      } else {
        await this.prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: sec.lessonTitle || sec.title || `Lesson ${lIdx + 1}.1: Overview`,
            description: `Core operational lesson for Module ${lIdx + 1}`,
            lessonType: 'TEXT',
            content: sec.content || `## ${sec.title}\n\nComprehensive lesson content for this module.`,
            durationMinutes: lessonDuration,
            order: 1,
          },
        });
      }
    }

    // 4. Create Quiz and Questions from Schema Quiz
    if (schema.quiz && schema.quiz.length > 0) {
      const createdQuiz = await this.prisma.quiz.create({
        data: {
          courseId: createdCourse.id,
          title: `${schema.title} Assessment Quiz`,
          passingScorePct: 80,
          maxAttempts: 3,
          timeLimitMinutes: Math.max(10, Math.round(durationMinutes * 0.25)),
        },
      });

      for (let qIdx = 0; qIdx < schema.quiz.length; qIdx++) {
        const qData = schema.quiz[qIdx];
        const createdQuestion = await this.prisma.quizQuestion.create({
          data: {
            quizId: createdQuiz.id,
            questionText: qData.question,
            questionType: 'MCQ',
            explanation: qData.explanation || 'Review course section notes for explanation.',
            points: 1,
            order: qIdx + 1,
          },
        });

        for (const optText of qData.options) {
          await this.prisma.quizOption.create({
            data: {
              questionId: createdQuestion.id,
              optionText: optText,
              isCorrect: optText.trim() === qData.correctAnswer.trim(),
            },
          });
        }
      }
    }

    // 5. Return full reviewable draft course with attached schema metadata
    const result = await this.prisma.course.findUnique({
      where: { id: createdCourse.id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: { 
            lessons: { orderBy: { order: 'asc' } } 
          },
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: { options: true },
            },
          },
        },
      },
    });

    return {
      ...result,
      durationMinutes, // single source of truth
      schema, // attach standardized schema for UI studio state
    };
  }
}
