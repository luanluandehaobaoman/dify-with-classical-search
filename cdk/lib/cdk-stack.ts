import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 创建 VPC
    const vpc = new ec2.Vpc(this, 'MyVPC', {
      maxAzs: 2,
      natGateways: 0, // 禁用 NAT 网关
    });

    // 创建安全组
    const securityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');

    // 创建 IAM 角色
    const role = new iam.Role(this, 'MyRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // 创建 Amazon Linux 2 EC2 实例
    const instance = new ec2.Instance(this, 'MyInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C7I, ec2.InstanceSize.XLARGE),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      securityGroup,
      role,
      vpcSubnets: {
        subnets: vpc.publicSubnets, // 将实例关联到公共子网
      },
      userData: ec2.UserData.forLinux(),
    });

    // 添加启动脚本
    instance.userData.addCommands(
      'sudo yum update -y',
      'sudo amazon-linux-extras install docker -y',
      'sudo service docker start',
      'sudo usermod -a -G docker ec2-user',
      'sudo yum install -y git',
      'sudo yum install -y golang',
      'git clone https://github.com/luanluandehaobaoman/dify-with-classical-search.git',
      'cd your-repo',
      'docker-compose up -d',
      'go run main1.go &',
      'go run main2.go &'
    );

    // 输出实例公共 IP 地址
    new cdk.CfnOutput(this, 'InstancePublicIp', {
      value: instance.instancePublicIp,
      description: 'Public IP address of the EC2 instance',
    });
  }
}