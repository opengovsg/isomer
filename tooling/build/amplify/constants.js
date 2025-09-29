export const AMPLIFY_BUILD_SPEC = `
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - rm -rf node_modules && rm -rf .next
        - curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/preBuild.sh | bash
    build:
      commands:
        - curl https://raw.githubusercontent.com/opengovsg/isomer/main/tooling/build/scripts/build.sh | bash
  artifacts:
    baseDirectory: out
    files:
      - '**/*'
`
