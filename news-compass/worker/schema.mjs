const str = { type: 'string' };
const arr = items => ({ type: 'array', items });
export const obj = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
export const evidence = obj({ sourceId: str, quote: str });
export const observation = obj({ text: str, evidence: arr(evidence) });
export const observations = arr(observation);
export const searchSchema = obj({
  event: obj({ name: str, date: str, people: arr(str), uncertainties: arr(str) }),
  articles: arr(obj({ url: str, title: str, medium: str, date: str }))
});
export const analysisSchema = obj({
  articles: arr(obj({ id: str, facts: observations, voices: observations, context: observations, focus: observations, agency: observations })),
  agreements: observations, differences: observations, contradictions: observations
});
export const answerSchema = obj({ claims: observations });
export const omissionsSchema = obj({ omissions: observations, context: observations });
export const section = obj({ heading: str, claims: observations });
export const comparisonTopic = obj({ topic: str, positions: observations });
export const overviewSchema = obj({ sections: arr(section), agreements: arr(comparisonTopic), differences: arr(comparisonTopic) });
export const questionSchema = obj({ question: str, rationale: observations, coverage: obj({ retained: observations, omitted: observations, reframed: observations }) });
