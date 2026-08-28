import {
  QUIZ_STEPS,
  getStepOptions,
  isOutOfAvatar,
} from '../data/landingQuiz'

function getStep5Option(step5) {
  const step5Def = QUIZ_STEPS.find((step) => step.id === 'step_5_inversion')
  return step5Def?.options?.find((opt) => opt.value === Number(step5))
}

export function calcularCalificacion(respuestas = {}) {
  const step1 = Number(respuestas.step_1_nivel)
  const step4 = Number(respuestas.step_4_acompanamiento)
  const step3a = respuestas.step_3a_freno_categoria
  const step3b = Number(respuestas.step_3b_freno_especifico)
  const step5 = Number(respuestas.step_5_inversion)
  const selected5 = getStep5Option(step5)

  // P5 — gate principal: inversión insuficiente descalifica aunque el resto califique.
  if (selected5?.qualification === 'hard_disqualifier') {
    return { calificado: false, razon: 'inversion_insuficiente' }
  }

  if (isOutOfAvatar(step1)) {
    return { calificado: false, razon: 'out_of_avatar' }
  }

  if (step4 === 1) {
    return { calificado: false, razon: 'prefiere_sin_acompanamiento' }
  }

  if (![2, 3, 4].includes(step4)) {
    return { calificado: false, razon: 'p4_no_califica' }
  }

  const step3bDef = QUIZ_STEPS.find((step) => step.id === 'step_3b_freno_especifico')
  const options3b = getStepOptions(step3bDef, { step_3a_freno_categoria: step3a })
  const selected3b = options3b.find((opt) => opt.value === step3b)
  if (selected3b?.type === 'hard_disqualifier') {
    return { calificado: false, razon: 'hard_disqualifier_p3b' }
  }

  return {
    calificado: true,
    step5_qualification: selected5?.qualification || null,
  }
}

export function esCalificado(data = {}) {
  const respuestas = data.quiz_answers || data
  return calcularCalificacion(respuestas).calificado
}
