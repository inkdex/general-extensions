
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { AsuraScans } from '../AsuraScans/main'
import sourceInfo from '../AsuraScans/pbconfig'

export async function runTests() {
  const suite = new TestSuite('AsuraScans tests')
  registerDefaultTests(suite, AsuraScans, sourceInfo)
  
  await suite.run()
}
                