
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { Webtoon } from '../Webtoon/main'
import sourceInfo from '../Webtoon/pbconfig'

export async function runTests() {
  const suite = new TestSuite('Webtoon tests')
  registerDefaultTests(suite, Webtoon, sourceInfo)
  
  await suite.run()
}
                