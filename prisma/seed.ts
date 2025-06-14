import { PrismaClient } from '../src/app/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create periods
  const ancientPeriod = await prisma.period.create({
    data: {
      name: 'Ancient Philosophy',
      description: 'The foundation of Western philosophy from 6th century BCE to 6th century CE',
      start: '600 BCE',
      end: '600 CE',
    }
  })

  const medievalPeriod = await prisma.period.create({
    data: {
      name: 'Medieval Philosophy',
      description: 'Philosophy during the Middle Ages, heavily influenced by Christian theology',
      start: '600 CE',
      end: '1400 CE',
    }
  })

  const enlightenmentPeriod = await prisma.period.create({
    data: {
      name: 'Enlightenment',
      description: 'The Age of Reason emphasizing individual liberty and religious tolerance',
      start: '1650 CE',
      end: '1800 CE',
    }
  })

  const modernPeriod = await prisma.period.create({
    data: {
      name: 'Modern Philosophy',
      description: 'The era of scientific revolution and Enlightenment thinking',
      start: '1400 CE',
      end: '1800 CE',
    }
  })

  const contemporaryPeriod = await prisma.period.create({
    data: {
      name: 'Contemporary Philosophy',
      description: 'Philosophy from the 19th century to present',
      start: '1800 CE',
      end: 'Present',
    }
  })

  // Create tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'Ethics' } }),
    prisma.tag.create({ data: { name: 'Metaphysics' } }),
    prisma.tag.create({ data: { name: 'Epistemology' } }),
    prisma.tag.create({ data: { name: 'Political Philosophy' } }),
    prisma.tag.create({ data: { name: 'Logic' } }),
    prisma.tag.create({ data: { name: 'Aesthetics' } }),
    prisma.tag.create({ data: { name: 'Philosophy of Mind' } }),
    prisma.tag.create({ data: { name: 'Existentialism' } }),
    prisma.tag.create({ data: { name: 'Phenomenology' } }),
    prisma.tag.create({ data: { name: 'Analytic Philosophy' } }),
    prisma.tag.create({ data: { name: 'Stoicism' } }),
    prisma.tag.create({ data: { name: 'Empiricism' } }),
    prisma.tag.create({ data: { name: 'Rationalism' } }),
    prisma.tag.create({ data: { name: 'Utilitarianism' } }),
    prisma.tag.create({ data: { name: 'Philosophy of Science' } }),
    prisma.tag.create({ data: { name: 'Theology' } }),
    prisma.tag.create({ data: { name: 'Pragmatism' } }),
    prisma.tag.create({ data: { name: 'Continental Philosophy' } }),
  ])

  // Create authors
  const plato = await prisma.author.create({
    data: {
      name: 'Plato',
      birth: '428 BCE',
      death: '348 BCE',
      nationality: 'Greek',
    }
  })

  const aristotle = await prisma.author.create({
    data: {
      name: 'Aristotle',
      birth: '384 BCE',
      death: '322 BCE',
      nationality: 'Greek',
    }
  })

  const descartes = await prisma.author.create({
    data: {
      name: 'René Descartes',
      birth: '1596 CE',
      death: '1650 CE',
      nationality: 'French',
    }
  })

  const kant = await prisma.author.create({
    data: {
      name: 'Immanuel Kant',
      birth: '1724 CE',
      death: '1804 CE',
      nationality: 'German',
    }
  })

  const hegel = await prisma.author.create({
    data: {
      name: 'Georg Wilhelm Friedrich Hegel',
      birth: '1770 CE',
      death: '1831 CE',
      nationality: 'German',
    }
  })

  const nietzsche = await prisma.author.create({
    data: {
      name: 'Friedrich Nietzsche',
      birth: '1844 CE',
      death: '1900 CE',
      nationality: 'German',
    }
  })

  const heidegger = await prisma.author.create({
    data: {
      name: 'Martin Heidegger',
      birth: '1889 CE',
      death: '1976 CE',
      nationality: 'German',
    }
  })

  const socrates = await prisma.author.create({
    data: {
      name: 'Socrates',
      birth: '470 BCE',
      death: '399 BCE',
      nationality: 'Greek',
    }
  })

  const aquinas = await prisma.author.create({
    data: {
      name: 'Thomas Aquinas',
      birth: '1225 CE',
      death: '1274 CE',
      nationality: 'Italian',
    }
  })

  const locke = await prisma.author.create({
    data: {
      name: 'John Locke',
      birth: '1632 CE',
      death: '1704 CE',
      nationality: 'English',
    }
  })

  const hume = await prisma.author.create({
    data: {
      name: 'David Hume',
      birth: '1711 CE',
      death: '1776 CE',
      nationality: 'Scottish',
    }
  })

  const mill = await prisma.author.create({
    data: {
      name: 'John Stuart Mill',
      birth: '1806 CE',
      death: '1873 CE',
      nationality: 'English',
    }
  })

  const sartre = await prisma.author.create({
    data: {
      name: 'Jean-Paul Sartre',
      birth: '1905 CE',
      death: '1980 CE',
      nationality: 'French',
    }
  })

  const wittgenstein = await prisma.author.create({
    data: {
      name: 'Ludwig Wittgenstein',
      birth: '1889 CE',
      death: '1951 CE',
      nationality: 'Austrian',
    }
  })

  const rawls = await prisma.author.create({
    data: {
      name: 'John Rawls',
      birth: '1921 CE',
      death: '2002 CE',
      nationality: 'American',
    }
  })

  // Create ideas
  const theoryOfForms = await prisma.idea.create({
    data: {
      title: 'Theory of Forms',
      description: 'The theory that non-physical forms represent the most accurate reality',
      year: -380,
      authorId: plato.id,
      periodId: ancientPeriod.id,
    }
  })

  const aristotelianLogic = await prisma.idea.create({
    data: {
      title: 'Aristotelian Logic',
      description: 'The foundation of formal logic including syllogistic reasoning',
      year: -350,
      authorId: aristotle.id,
      periodId: ancientPeriod.id,
    }
  })

  const cogito = await prisma.idea.create({
    data: {
      title: 'Cogito Ergo Sum',
      description: 'I think, therefore I am - the foundation of knowledge in the act of doubt',
      year: 1637,
      authorId: descartes.id,
      periodId: modernPeriod.id,
    }
  })

  const categoricalImperative = await prisma.idea.create({
    data: {
      title: 'Categorical Imperative',
      description: 'Act only according to maxims that could become universal laws',
      year: 1785,
      authorId: kant.id,
      periodId: modernPeriod.id,
    }
  })

  const dialectic = await prisma.idea.create({
    data: {
      title: 'Hegelian Dialectic',
      description: 'The process of thesis, antithesis, and synthesis in the development of ideas',
      year: 1807,
      authorId: hegel.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const willToPower = await prisma.idea.create({
    data: {
      title: 'Will to Power',
      description: 'The main driving force in humans - achievement, ambition, and striving to reach the highest possible position in life',
      year: 1883,
      authorId: nietzsche.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const dasein = await prisma.idea.create({
    data: {
      title: 'Dasein',
      description: 'Being-in-the-world as the fundamental structure of human existence',
      year: 1927,
      authorId: heidegger.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const socratesMethod = await prisma.idea.create({
    data: {
      title: 'Socratic Method',
      description: 'A form of cooperative argumentative dialogue that stimulates critical thinking through systematic questioning',
      year: -400,
      authorId: socrates.id,
      periodId: ancientPeriod.id,
    }
  })

  const tabulaRasa = await prisma.idea.create({
    data: {
      title: 'Tabula Rasa',
      description: 'The mind is a blank slate at birth, and knowledge comes from sensory experience',
      year: 1689,
      authorId: locke.id,
      periodId: enlightenmentPeriod.id,
    }
  })

  const isOughtProblem = await prisma.idea.create({
    data: {
      title: 'Is-Ought Problem',
      description: 'The difficulty of deriving normative conclusions from purely factual premises',
      year: 1739,
      authorId: hume.id,
      periodId: enlightenmentPeriod.id,
    }
  })

  const utilitarianism = await prisma.idea.create({
    data: {
      title: 'Utilitarianism',
      description: 'Actions are right insofar as they tend to promote happiness and wrong as they tend to produce the reverse',
      year: 1863,
      authorId: mill.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const naturalLaw = await prisma.idea.create({
    data: {
      title: 'Natural Law Theory',
      description: 'Moral principles can be discovered through reason and are inherent in human nature',
      year: 1265,
      authorId: aquinas.id,
      periodId: medievalPeriod.id,
    }
  })

  const badFaith = await prisma.idea.create({
    data: {
      title: 'Bad Faith',
      description: 'Self-deception where one denies their fundamental freedom and responsibility',
      year: 1943,
      authorId: sartre.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const languageGames = await prisma.idea.create({
    data: {
      title: 'Language Games',
      description: 'Language and the actions into which it is woven form irreducible language games',
      year: 1953,
      authorId: wittgenstein.id,
      periodId: contemporaryPeriod.id,
    }
  })

  const veilOfIgnorance = await prisma.idea.create({
    data: {
      title: 'Veil of Ignorance',
      description: 'A method of determining the morality of political issues based on impartial reasoning',
      year: 1971,
      authorId: rawls.id,
      periodId: contemporaryPeriod.id,
    }
  })

  // Create idea-tag relationships
  await Promise.all([
    // Theory of Forms
    prisma.ideaTag.create({ data: { ideaId: theoryOfForms.id, tagId: tags[1].id } }), // Metaphysics
    prisma.ideaTag.create({ data: { ideaId: theoryOfForms.id, tagId: tags[2].id } }), // Epistemology

    // Aristotelian Logic
    prisma.ideaTag.create({ data: { ideaId: aristotelianLogic.id, tagId: tags[4].id } }), // Logic
    prisma.ideaTag.create({ data: { ideaId: aristotelianLogic.id, tagId: tags[2].id } }), // Epistemology

    // Cogito
    prisma.ideaTag.create({ data: { ideaId: cogito.id, tagId: tags[2].id } }), // Epistemology
    prisma.ideaTag.create({ data: { ideaId: cogito.id, tagId: tags[1].id } }), // Metaphysics
    prisma.ideaTag.create({ data: { ideaId: cogito.id, tagId: tags[12].id } }), // Rationalism

    // Categorical Imperative
    prisma.ideaTag.create({ data: { ideaId: categoricalImperative.id, tagId: tags[0].id } }), // Ethics

    // Hegelian Dialectic
    prisma.ideaTag.create({ data: { ideaId: dialectic.id, tagId: tags[1].id } }), // Metaphysics
    prisma.ideaTag.create({ data: { ideaId: dialectic.id, tagId: tags[4].id } }), // Logic

    // Will to Power
    prisma.ideaTag.create({ data: { ideaId: willToPower.id, tagId: tags[0].id } }), // Ethics
    prisma.ideaTag.create({ data: { ideaId: willToPower.id, tagId: tags[7].id } }), // Existentialism

    // Dasein
    prisma.ideaTag.create({ data: { ideaId: dasein.id, tagId: tags[7].id } }), // Existentialism
    prisma.ideaTag.create({ data: { ideaId: dasein.id, tagId: tags[8].id } }), // Phenomenology

    // Socratic Method
    prisma.ideaTag.create({ data: { ideaId: socratesMethod.id, tagId: tags[2].id } }), // Epistemology
    prisma.ideaTag.create({ data: { ideaId: socratesMethod.id, tagId: tags[0].id } }), // Ethics

    // Tabula Rasa
    prisma.ideaTag.create({ data: { ideaId: tabulaRasa.id, tagId: tags[2].id } }), // Epistemology
    prisma.ideaTag.create({ data: { ideaId: tabulaRasa.id, tagId: tags[11].id } }), // Empiricism

    // Is-Ought Problem
    prisma.ideaTag.create({ data: { ideaId: isOughtProblem.id, tagId: tags[0].id } }), // Ethics
    prisma.ideaTag.create({ data: { ideaId: isOughtProblem.id, tagId: tags[2].id } }), // Epistemology

    // Utilitarianism
    prisma.ideaTag.create({ data: { ideaId: utilitarianism.id, tagId: tags[0].id } }), // Ethics
    prisma.ideaTag.create({ data: { ideaId: utilitarianism.id, tagId: tags[13].id } }), // Utilitarianism
    prisma.ideaTag.create({ data: { ideaId: utilitarianism.id, tagId: tags[3].id } }), // Political Philosophy

    // Natural Law Theory
    prisma.ideaTag.create({ data: { ideaId: naturalLaw.id, tagId: tags[0].id } }), // Ethics
    prisma.ideaTag.create({ data: { ideaId: naturalLaw.id, tagId: tags[15].id } }), // Theology
    prisma.ideaTag.create({ data: { ideaId: naturalLaw.id, tagId: tags[3].id } }), // Political Philosophy

    // Bad Faith
    prisma.ideaTag.create({ data: { ideaId: badFaith.id, tagId: tags[7].id } }), // Existentialism
    prisma.ideaTag.create({ data: { ideaId: badFaith.id, tagId: tags[0].id } }), // Ethics

    // Language Games
    prisma.ideaTag.create({ data: { ideaId: languageGames.id, tagId: tags[9].id } }), // Analytic Philosophy
    prisma.ideaTag.create({ data: { ideaId: languageGames.id, tagId: tags[2].id } }), // Epistemology

    // Veil of Ignorance
    prisma.ideaTag.create({ data: { ideaId: veilOfIgnorance.id, tagId: tags[3].id } }), // Political Philosophy
    prisma.ideaTag.create({ data: { ideaId: veilOfIgnorance.id, tagId: tags[0].id } }), // Ethics
  ])

  // Create idea relationships
  await Promise.all([
    // Aristotle's logic builds upon Plato's forms
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: aristotelianLogic.id,
        targetIdeaId: theoryOfForms.id,
        type: 'builds_upon',
        description: 'Aristotle developed his logical system partly in response to Platonic metaphysics'
      }
    }),

    // Plato builds upon Socratic method
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: theoryOfForms.id,
        targetIdeaId: socratesMethod.id,
        type: 'builds_upon',
        description: 'Plato developed his metaphysical theories using Socratic questioning'
      }
    }),

    // Locke's empiricism contradicts Cartesian rationalism
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: tabulaRasa.id,
        targetIdeaId: cogito.id,
        type: 'contradicts',
        description: 'Locke argues knowledge comes from experience, not innate rational intuition'
      }
    }),

    // Hume's is-ought problem challenges moral reasoning
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: isOughtProblem.id,
        targetIdeaId: naturalLaw.id,
        type: 'refutes',
        description: 'Hume challenges the derivation of moral ought from natural facts'
      }
    }),

    // Kant's categorical imperative synthesizes reason and morality
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: categoricalImperative.id,
        targetIdeaId: cogito.id,
        type: 'synthesizes',
        description: 'Kant builds on Cartesian rationalism to establish moral principles'
      }
    }),

    // Kant responds to Hume's skepticism
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: categoricalImperative.id,
        targetIdeaId: isOughtProblem.id,
        type: 'synthesizes',
        description: 'Kant attempts to bridge the is-ought gap through practical reason'
      }
    }),

    // Mill's utilitarianism refines ethical theory
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: utilitarianism.id,
        targetIdeaId: categoricalImperative.id,
        type: 'contradicts',
        description: 'Mill proposes consequences rather than duty as the basis of moral action'
      }
    }),

    // Hegel's dialectic influences later German philosophy
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: dialectic.id,
        targetIdeaId: categoricalImperative.id,
        type: 'builds_upon',
        description: 'Hegel develops a dynamic view of reason beyond Kantian categories'
      }
    }),

    // Nietzsche's will to power contradicts Kantian ethics
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: willToPower.id,
        targetIdeaId: categoricalImperative.id,
        type: 'contradicts',
        description: 'Nietzsche rejects universal moral laws in favor of individual self-assertion'
      }
    }),

    // Sartre's bad faith builds on existential themes
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: badFaith.id,
        targetIdeaId: willToPower.id,
        type: 'builds_upon',
        description: 'Sartre develops Nietzschean themes of authenticity and self-creation'
      }
    }),

    // Heidegger's Dasein builds on but transforms German idealism
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: dasein.id,
        targetIdeaId: dialectic.id,
        type: 'builds_upon',
        description: 'Heidegger transforms Hegelian dialectics into existential analysis'
      }
    }),

    // Wittgenstein's language games transform analytic philosophy
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: languageGames.id,
        targetIdeaId: aristotelianLogic.id,
        type: 'refutes',
        description: 'Wittgenstein challenges formal logic with ordinary language philosophy'
      }
    }),

    // Rawls builds on social contract tradition
    prisma.ideaRelationship.create({
      data: {
        sourceIdeaId: veilOfIgnorance.id,
        targetIdeaId: utilitarianism.id,
        type: 'synthesizes',
        description: 'Rawls combines utilitarian concerns with deontological fairness'
      }
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`Created:
  - ${5} periods
  - ${18} tags  
  - ${16} authors
  - ${16} ideas
  - ${31} idea-tag relationships
  - ${13} idea relationships`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })