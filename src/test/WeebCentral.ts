
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { WeebCentral } from '../WeebCentral/main'
import sourceInfo from '../WeebCentral/pbconfig'

export async function runTests() {
  const suite = new TestSuite('WeebCentral tests')
  registerDefaultTests(suite, WeebCentral, sourceInfo)
  
  await suite.run()
}
                