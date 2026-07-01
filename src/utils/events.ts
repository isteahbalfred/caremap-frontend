// Nom de l'événement custom utilisé pour piloter le chatbot depuis n'importe
// quelle page (ex: bouton "Demander à l'assistant" sur une fiche médicament).
// Le Chatbot écoute cet événement globalement ; n'importe quel composant peut
// le déclencher sans avoir besoin d'accéder à l'état interne du chatbot.
export const ASK_ASSISTANT_EVENT = 'caremap:ask-assistant';

export interface AskAssistantDetail {
  text: string;
}

export function dispatchAskAssistant(text: string) {
  window.dispatchEvent(new CustomEvent<AskAssistantDetail>(ASK_ASSISTANT_EVENT, { detail: { text } }));
}