
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaDex } from '../MangaDex/main'
import sourceInfo from '../MangaDex/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaDex tests')
  registerDefaultTests(suite, MangaDex, sourceInfo)
  
  await suite.run()
}
                