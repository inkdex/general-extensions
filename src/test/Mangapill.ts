
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { Mangapill } from '../Mangapill/main'
import sourceInfo from '../Mangapill/pbconfig'

export async function runTests() {
  const suite = new TestSuite('Mangapill tests')
  registerDefaultTests(suite, Mangapill, sourceInfo)
  
  await suite.run()
}
                