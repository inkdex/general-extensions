
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { Mgeko } from '../Mgeko/main'
import sourceInfo from '../Mgeko/pbconfig'

export async function runTests() {
  const suite = new TestSuite('Mgeko tests')
  registerDefaultTests(suite, Mgeko, sourceInfo)
  
  await suite.run()
}
                