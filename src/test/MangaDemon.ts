
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaDemon } from '../MangaDemon/main'
import sourceInfo from '../MangaDemon/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaDemon tests')
  registerDefaultTests(suite, MangaDemon, sourceInfo)
  
  await suite.run()
}
                