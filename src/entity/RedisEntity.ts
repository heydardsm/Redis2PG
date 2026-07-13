import { Entity, Column, Index } from "typeorm";

@Entity({ name: "redis" })
export class RedisEntity {
    @Index({ unique: true })
    @Column({ type: "varchar", length: 255, primary: true})
    key!: string;

    @Column({ type: "text" })
    value: string;

    @Column({type: "timestamp", nullable: true, default: null })
    expired_at: Date | null;
}
