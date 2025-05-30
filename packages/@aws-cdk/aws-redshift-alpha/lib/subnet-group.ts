import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { IResource, RemovalPolicy, Resource } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { CfnClusterSubnetGroup } from 'aws-cdk-lib/aws-redshift';
import { addConstructMetadata } from 'aws-cdk-lib/core/lib/metadata-resource';
import { propertyInjectable } from 'aws-cdk-lib/core/lib/prop-injectable';

/**
 * Interface for a cluster subnet group.
 */
export interface IClusterSubnetGroup extends IResource {
  /**
   * The name of the cluster subnet group.
   * @attribute
   */
  readonly clusterSubnetGroupName: string;
}

/**
 * Properties for creating a ClusterSubnetGroup.
 */
export interface ClusterSubnetGroupProps {
  /**
   * Description of the subnet group.
   */
  readonly description: string;

  /**
   * The VPC to place the subnet group in.
   */
  readonly vpc: ec2.IVpc;

  /**
   * Which subnets within the VPC to associate with this group.
   *
   * @default - private subnets
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * The removal policy to apply when the subnet group are removed
   * from the stack or replaced during an update.
   *
   * @default RemovalPolicy.RETAIN
   */
  readonly removalPolicy?: RemovalPolicy;
}

/**
 * Class for creating a Redshift cluster subnet group
 *
 * @resource AWS::Redshift::ClusterSubnetGroup
 */
@propertyInjectable
export class ClusterSubnetGroup extends Resource implements IClusterSubnetGroup {
  /** Uniquely identifies this class. */
  public static readonly PROPERTY_INJECTION_ID: string = '@aws-cdk.aws-redshift-alpha.ClusterSubnetGroup';

  /**
   * Imports an existing subnet group by name.
   */
  public static fromClusterSubnetGroupName(scope: Construct, id: string, clusterSubnetGroupName: string): IClusterSubnetGroup {
    return new class extends Resource implements IClusterSubnetGroup {
      public readonly clusterSubnetGroupName = clusterSubnetGroupName;
    }(scope, id);
  }

  public readonly clusterSubnetGroupName: string;

  constructor(scope: Construct, id: string, props: ClusterSubnetGroupProps) {
    super(scope, id);
    // Enhanced CDK Analytics Telemetry
    addConstructMetadata(this, props);

    const { subnetIds } = props.vpc.selectSubnets(props.vpcSubnets ?? { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS });

    const subnetGroup = new CfnClusterSubnetGroup(this, 'Default', {
      description: props.description,
      subnetIds,
    });
    subnetGroup.applyRemovalPolicy(props.removalPolicy ?? RemovalPolicy.RETAIN, {
      applyToUpdateReplacePolicy: true,
    });

    this.clusterSubnetGroupName = subnetGroup.ref;
  }
}
