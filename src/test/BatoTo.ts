
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { BatoTo } from '../BatoTo/main'
import sourceInfo from '../BatoTo/pbconfig'

export async function runTests() {
  const suite = new TestSuite('BatoTo tests')
  registerDefaultTests(suite, BatoTo, sourceInfo)
  
  await suite.run()
}
                