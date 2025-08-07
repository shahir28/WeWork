import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-example"
});

export interface MeetingSummary {
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
  participants: string[];
}

export interface FocusInsight {
  recommendation: string;
  breakSuggestion: boolean;
  ambientSoundSuggestion: string;
  productivityScore: number;
}

export async function generateMeetingSummary(
  transcript: string,
  participants: string[]
): Promise<MeetingSummary> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI meeting assistant. Analyze the meeting transcript and provide a structured summary. Respond with JSON in this format: 
          {
            "summary": "Brief meeting summary",
            "actionItems": ["List of action items"],
            "keyDecisions": ["Important decisions made"],
            "participants": ["Participant names mentioned"]
          }`
        },
        {
          role: "user",
          content: `Meeting transcript with participants ${participants.join(", ")}:\n\n${transcript}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "Meeting summary unavailable",
      actionItems: result.actionItems || [],
      keyDecisions: result.keyDecisions || [],
      participants: result.participants || participants
    };
  } catch (error) {
    console.error("Failed to generate meeting summary:", error);
    return {
      summary: "AI meeting summary temporarily unavailable",
      actionItems: [],
      keyDecisions: [],
      participants
    };
  }
}

export async function generateFocusInsight(
  sessionDuration: number,
  roomType: string,
  timeOfDay: number
): Promise<FocusInsight> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a productivity AI assistant. Analyze focus session data and provide insights. Respond with JSON in this format:
          {
            "recommendation": "Personalized productivity tip",
            "breakSuggestion": true/false,
            "ambientSoundSuggestion": "sound_type",
            "productivityScore": 1-100
          }`
        },
        {
          role: "user",
          content: `Session: ${sessionDuration} minutes in ${roomType} room at ${timeOfDay} hour. Provide insights.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      recommendation: result.recommendation || "Keep up the great work!",
      breakSuggestion: result.breakSuggestion || false,
      ambientSoundSuggestion: result.ambientSoundSuggestion || "forest",
      productivityScore: Math.max(1, Math.min(100, result.productivityScore || 75))
    };
  } catch (error) {
    console.error("Failed to generate focus insight:", error);
    return {
      recommendation: "AI insights temporarily unavailable",
      breakSuggestion: sessionDuration > 90,
      ambientSoundSuggestion: "forest",
      productivityScore: 75
    };
  }
}

export async function suggestAmbientSound(
  roomType: string,
  participantCount: number,
  timeOfDay: number
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an ambient sound recommendation AI. Based on room context, suggest the most appropriate ambient sound. Respond with JSON: {"sound": "rain|forest|fire|cafe|ocean|white_noise"}`
        },
        {
          role: "user",
          content: `Room type: ${roomType}, Participants: ${participantCount}, Time: ${timeOfDay} hour`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 100
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.sound || "forest";
  } catch (error) {
    console.error("Failed to suggest ambient sound:", error);
    return "forest";
  }
}
