
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaPlus } from '../MangaPlus/main'
import sourceInfo from '../MangaPlus/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaPlus tests')
  registerDefaultTests(suite, MangaPlus, sourceInfo)
  
  await suite.run()
}
                