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

  async draftCourse(dto: DraftCourseDto, userId: string) {
    // 1. Generate Outline
    const outline = await this.generateOutline({
      topic: dto.topic,
      targetRole: dto.targetRole,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
    });

    const year = new Date().getFullYear();
    const count = await this.prisma.course.count();
    const courseCode = `CRS-${year}-${String(count + 1).padStart(3, '0')}`;

    // 2. Create Course in DRAFT state
    const createdCourse = await this.prisma.course.create({
      data: {
        title: outline.title || `${dto.topic} (${dto.targetRole})`,
        description: outline.description || `AI Drafted training for ${dto.topic}`,
        category: outline.category || 'Sales & Support',
        difficulty: dto.difficulty || 'Intermediate',
        durationMinutes: dto.estimatedDurationMinutes || 60,
        courseCode,
        status: 'DRAFT',
        version: 1,
        createdBy: { connect: { id: userId } },
        tags: [dto.targetRole, 'AI-Generated', 'Draft'],
      },
    });

    // 3. Generate Modules & Lessons
    for (let mIdx = 0; mIdx < outline.modules.length; mIdx++) {
      const modData = outline.modules[mIdx];
      const createdModule = await this.prisma.module.create({
        data: {
          courseId: createdCourse.id,
          title: modData.title,
          order: mIdx + 1,
        },
      });

      for (let lIdx = 0; lIdx < modData.lessons.length; lIdx++) {
        const lesData = modData.lessons[lIdx];
        const generatedLesson = await this.generateLesson({
          lessonTitle: lesData.title,
          targetRole: dto.targetRole,
        });

        await this.prisma.lesson.create({
          data: {
            moduleId: createdModule.id,
            title: lesData.title,
            description: lesData.summary,
            lessonType: 'TEXT',
            content: generatedLesson.content,
            durationMinutes: 15,
            order: lIdx + 1,
          },
        });
      }
    }

    // 4. Optionally Generate Quiz Assessment tied to first lesson content
    if (dto.includeQuiz !== false) {
      const generatedQuiz = await this.generateQuiz({
        lessonTitle: `${dto.topic} Knowledge Check`,
        lessonContent: `Assessment for ${dto.topic} targeting ${dto.targetRole}`,
        targetRole: dto.targetRole,
        difficulty: dto.difficulty,
      });

      const createdQuiz = await this.prisma.quiz.create({
        data: {
          courseId: createdCourse.id,
          title: generatedQuiz.title,
          passingScorePct: generatedQuiz.passingScorePct || 80,
          maxAttempts: generatedQuiz.maxAttempts || 3,
          timeLimitMinutes: generatedQuiz.timeLimitMinutes || 15,
        },
      });

      for (let qIdx = 0; qIdx < generatedQuiz.questions.length; qIdx++) {
        const qData = generatedQuiz.questions[qIdx];
        const createdQuestion = await this.prisma.quizQuestion.create({
          data: {
            quizId: createdQuiz.id,
            questionText: qData.questionText,
            questionType: qData.questionType as any,
            explanation: qData.explanation,
            points: qData.points || 1,
            order: qIdx + 1,
          },
        });

        for (const optData of qData.options) {
          await this.prisma.quizOption.create({
            data: {
              questionId: createdQuestion.id,
              optionText: optData.optionText,
              isCorrect: optData.isCorrect,
            },
          });
        }
      }
    }

    // Return full reviewable draft course
    return this.prisma.course.findUnique({
      where: { id: createdCourse.id },
      include: {
        modules: {
          include: { lessons: true },
        },
        quizzes: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });
  }
}
