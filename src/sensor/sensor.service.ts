import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IoT } from 'src/schemas/sensordata';

@Injectable()
export class SensorService {
  constructor(@InjectModel(IoT.name) private sensorModel: Model<IoT>) {}

  async findAll(): Promise<IoT[]> {
    return this.sensorModel.find().exec();
  }

  async findByDevEUI(DevEUI: string): Promise<IoT[]> {
    const sensorData = await this.sensorModel.find({ DevEUI }).exec();
    if (!sensorData || sensorData.length === 0) {
      throw new NotFoundException(`Sensor data not found for DevEUI: ${DevEUI}`);
    }
    return sensorData;
  }

  async findLastValueOfEachDevice(): Promise<IoT[]> {
    const sensorData = await this.sensorModel.aggregate([
      // Trier par timestamp pour obtenir les dernières données en premier
      { $sort: { timestamp: -1 } },
  
      // Grouper par DevEUI pour obtenir la dernière entrée pour chaque dispositif
      {
        $group: {
          _id: "$DevEUI",
          latestData: { $first: "$$ROOT" }
        }
      },
  
      // Remplacer la racine pour obtenir les documents les plus récents
      { $replaceRoot: { newRoot: "$latestData" } }
    ]).exec();
  
    if (!sensorData || sensorData.length === 0) {
      throw new NotFoundException('No sensor data found.');
    }
    return sensorData;
  }
  }
