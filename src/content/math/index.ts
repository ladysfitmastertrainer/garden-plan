import type { GeneratorMap } from '../factory'
import g1 from './g1'
import g2 from './g2'
import g3 from './g3'
import g4 from './g4'
import g5 from './g5'

/** Toàn bộ bộ sinh câu hỏi Toán lớp 1-5. Mỗi kỹ năng đúng một generator. */
export const mathGenerators: GeneratorMap = { ...g1, ...g2, ...g3, ...g4, ...g5 }
