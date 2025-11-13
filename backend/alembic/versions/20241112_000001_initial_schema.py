"""Initial schema for condominio system.

Revision ID: 20241112_000001
Revises:
Create Date: 2024-11-12 00:00:01
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20241112_000001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "condominios",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("nombre", sa.String(length=200), nullable=False),
        sa.Column("direccion", sa.String(length=300), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre", name="uq_condominios_nombre"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )

    op.create_table(
        "usuarios",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("nombre_completo", sa.String(length=200), nullable=False),
        sa.Column("rol", sa.String(length=30), server_default="Residente", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notificaciones_email", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column("notificaciones_push", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_usuarios_email"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_usuarios_email", "usuarios", ["email"])

    op.create_table(
        "viviendas",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("condominio_id", sa.BigInteger(), nullable=False),
        sa.Column("numero_vivienda", sa.String(length=50), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "cargo_fijo_uf",
            sa.Numeric(precision=10, scale=2),
            server_default="0",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["condominio_id"],
            ["condominios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_viviendas_condominio",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "condominio_id",
            "numero_vivienda",
            name="uq_viviendas_condominio_numero",
        ),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_viviendas_condominio_id", "viviendas", ["condominio_id"])

    op.create_table(
        "residentes_viviendas",
        sa.Column("usuario_id", sa.BigInteger(), nullable=False),
        sa.Column("vivienda_id", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
            name="fk_residentes_usuario",
        ),
        sa.ForeignKeyConstraint(
            ["vivienda_id"],
            ["viviendas.id"],
            onupdate="CASCADE",
            ondelete="CASCADE",
            name="fk_residentes_vivienda",
        ),
        sa.PrimaryKeyConstraint("usuario_id", "vivienda_id"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_resviv_usuario_id", "residentes_viviendas", ["usuario_id"])
    op.create_index("idx_resviv_vivienda_id", "residentes_viviendas", ["vivienda_id"])

    op.create_table(
        "gastos_comunes",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vivienda_id", sa.BigInteger(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("monto_total", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("estado", sa.String(length=20), server_default="pendiente", nullable=False),
        sa.Column("vencimiento", sa.Date(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["vivienda_id"],
            ["viviendas.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_gastos_vivienda",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vivienda_id", "mes", "ano", name="uq_gastos_vivienda_mes_ano"),
        sa.CheckConstraint("mes BETWEEN 1 AND 12", name="chk_mes"),
        sa.CheckConstraint("ano >= 2000", name="chk_ano"),
        sa.CheckConstraint("monto_total >= 0", name="chk_monto_total"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_gastos_vivienda_id", "gastos_comunes", ["vivienda_id"])

    op.create_table(
        "multas",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("vivienda_id", sa.BigInteger(), nullable=False),
        sa.Column("monto", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("descripcion", sa.String(length=500), nullable=True),
        sa.Column("fecha_aplicada", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["vivienda_id"],
            ["viviendas.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_multas_vivienda",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("monto >= 0", name="chk_multa_monto"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_multas_vivienda_id", "multas", ["vivienda_id"])

    op.create_table(
        "espacios_comunes",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("condominio_id", sa.BigInteger(), nullable=False),
        sa.Column("nombre", sa.String(length=150), nullable=False),
        sa.Column("requiere_pago", sa.Boolean(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["condominio_id"],
            ["condominios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_espacios_condominio",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("condominio_id", "nombre", name="uq_espacios_condominio_nombre"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_espacios_condominio_id", "espacios_comunes", ["condominio_id"])

    op.create_table(
        "reservas",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("espacio_comun_id", sa.BigInteger(), nullable=False),
        sa.Column("usuario_id", sa.BigInteger(), nullable=False),
        sa.Column("fecha_hora_inicio", sa.DateTime(timezone=True), nullable=False),
        sa.Column("fecha_hora_fin", sa.DateTime(timezone=True), nullable=False),
        sa.Column("monto_pago", sa.Numeric(precision=14, scale=2), server_default="0", nullable=False),
        sa.Column("estado_pago", sa.String(length=20), server_default="pendiente", nullable=False),
        sa.Column("google_event_id", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["espacio_comun_id"],
            ["espacios_comunes.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_reservas_espacio",
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_reservas_usuario",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("fecha_hora_fin > fecha_hora_inicio", name="chk_reservas_fechas"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_reservas_espacio_id", "reservas", ["espacio_comun_id"])
    op.create_index("idx_reservas_usuario_id", "reservas", ["usuario_id"])

    op.create_table(
        "pagos",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("gasto_comun_id", sa.BigInteger(), nullable=False),
        sa.Column("usuario_id", sa.BigInteger(), nullable=False),
        sa.Column("monto_pagado", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column(
            "fecha_pago",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column("metodo_pago", sa.String(length=30), server_default="webpay", nullable=False),
        sa.ForeignKeyConstraint(
            ["gasto_comun_id"],
            ["gastos_comunes.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_pagos_gasto",
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_pagos_usuario",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("monto_pagado >= 0", name="chk_pagos_monto"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_pagos_gasto_id", "pagos", ["gasto_comun_id"])
    op.create_index("idx_pagos_usuario_id", "pagos", ["usuario_id"])

    op.create_table(
        "anuncios",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("condominio_id", sa.BigInteger(), nullable=False),
        sa.Column("titulo", sa.String(length=200), nullable=False),
        sa.Column("contenido", sa.String(length=5000), nullable=False),
        sa.Column("tipo", sa.String(length=50), server_default="general", nullable=False),
        sa.Column("autor_id", sa.BigInteger(), nullable=False),
        sa.Column("fecha_publicacion", sa.Date(), nullable=False),
        sa.Column("fecha_expiracion", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["autor_id"],
            ["usuarios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_anuncios_autor",
        ),
        sa.ForeignKeyConstraint(
            ["condominio_id"],
            ["condominios.id"],
            onupdate="CASCADE",
            ondelete="RESTRICT",
            name="fk_anuncios_condominio",
        ),
        sa.PrimaryKeyConstraint("id"),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
    )
    op.create_index("idx_anuncios_condominio_id", "anuncios", ["condominio_id"])

    # Datos seed
    now = datetime.utcnow()
    condominio_id = 1
    vivienda_101_id = 1
    vivienda_102_id = 2
    usuario_residente_id = 1
    usuario_admin_id = 2
    usuario_conserje_id = 3

    op.bulk_insert(
        sa.table(
            "condominios",
            sa.column("id", sa.BigInteger()),
            sa.column("nombre", sa.String()),
            sa.column("direccion", sa.String()),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("updated_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "id": condominio_id,
                "nombre": "Condominio Los Alerces",
                "direccion": "Av. Siempre Viva 1234, Santiago",
                "created_at": now,
                "updated_at": now,
            }
        ],
    )

    op.bulk_insert(
        sa.table(
            "viviendas",
            sa.column("id", sa.BigInteger()),
            sa.column("condominio_id", sa.BigInteger()),
            sa.column("numero_vivienda", sa.String()),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("updated_at", sa.DateTime(timezone=True)),
            sa.column("cargo_fijo_uf", sa.Numeric(10, 2)),
        ),
        [
            {
                "id": vivienda_101_id,
                "condominio_id": condominio_id,
                "numero_vivienda": "Dpto 101",
                "created_at": now,
                "updated_at": now,
                "cargo_fijo_uf": Decimal("0"),
            },
            {
                "id": vivienda_102_id,
                "condominio_id": condominio_id,
                "numero_vivienda": "Dpto 102",
                "created_at": now,
                "updated_at": now,
                "cargo_fijo_uf": Decimal("0"),
            },
        ],
    )

    password_hash = "$2b$12$QsXhxkm5xF0rnzO63VHanehDVzkPQgi4gfARKAvFpGfd3dgCwh2Ry"
    op.bulk_insert(
        sa.table(
            "usuarios",
            sa.column("id", sa.BigInteger()),
            sa.column("email", sa.String()),
            sa.column("password_hash", sa.String()),
            sa.column("nombre_completo", sa.String()),
            sa.column("rol", sa.String()),
            sa.column("is_active", sa.Boolean()),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("updated_at", sa.DateTime(timezone=True)),
            sa.column("notificaciones_email", sa.Boolean()),
            sa.column("notificaciones_push", sa.Boolean()),
        ),
        [
            {
                "id": usuario_residente_id,
                "email": "residente@example.com",
                "password_hash": password_hash,
                "nombre_completo": "Juan Pérez",
                "rol": "Residente",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                "notificaciones_email": True,
                "notificaciones_push": True,
            },
            {
                "id": usuario_admin_id,
                "email": "admin@example.com",
                "password_hash": password_hash,
                "nombre_completo": "María González",
                "rol": "Administrador",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                "notificaciones_email": True,
                "notificaciones_push": True,
            },
            {
                "id": usuario_conserje_id,
                "email": "conserje@example.com",
                "password_hash": password_hash,
                "nombre_completo": "Carlos Ramírez",
                "rol": "Conserje",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
                "notificaciones_email": True,
                "notificaciones_push": True,
            },
        ],
    )

    op.bulk_insert(
        sa.table(
            "residentes_viviendas",
            sa.column("usuario_id", sa.BigInteger()),
            sa.column("vivienda_id", sa.BigInteger()),
        ),
        [
            {"usuario_id": usuario_residente_id, "vivienda_id": vivienda_101_id},
        ],
    )

    gasto_enero_id = 1
    op.bulk_insert(
        sa.table(
            "gastos_comunes",
            sa.column("id", sa.BigInteger()),
            sa.column("vivienda_id", sa.BigInteger()),
            sa.column("mes", sa.Integer()),
            sa.column("ano", sa.Integer()),
            sa.column("monto_total", sa.Numeric(14, 2)),
            sa.column("estado", sa.String()),
            sa.column("vencimiento", sa.Date()),
            sa.column("created_at", sa.DateTime(timezone=True)),
            sa.column("updated_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "id": gasto_enero_id,
                "vivienda_id": vivienda_101_id,
                "mes": 1,
                "ano": 2025,
                "monto_total": Decimal("150000.00"),
                "estado": "pendiente",
                "vencimiento": datetime(2025, 1, 31).date(),
                "created_at": now,
                "updated_at": now,
            },
        ],
    )

    op.bulk_insert(
        sa.table(
            "multas",
            sa.column("id", sa.BigInteger()),
            sa.column("vivienda_id", sa.BigInteger()),
            sa.column("monto", sa.Numeric(14, 2)),
            sa.column("descripcion", sa.String()),
            sa.column("fecha_aplicada", sa.Date()),
            sa.column("created_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "id": 1,
                "vivienda_id": vivienda_101_id,
                "monto": Decimal("25000.00"),
                "descripcion": "Ruidos molestos",
                "fecha_aplicada": (datetime.utcnow() - timedelta(days=10)).date(),
                "created_at": now,
            }
        ],
    )

    espacio_quincho_id = 1
    op.bulk_insert(
        sa.table(
            "espacios_comunes",
            sa.column("id", sa.BigInteger()),
            sa.column("condominio_id", sa.BigInteger()),
            sa.column("nombre", sa.String()),
            sa.column("requiere_pago", sa.Boolean()),
            sa.column("created_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "id": espacio_quincho_id,
                "condominio_id": condominio_id,
                "nombre": "Quincho",
                "requiere_pago": True,
                "created_at": now,
            }
        ],
    )

    op.bulk_insert(
        sa.table(
            "reservas",
            sa.column("id", sa.BigInteger()),
            sa.column("espacio_comun_id", sa.BigInteger()),
            sa.column("usuario_id", sa.BigInteger()),
            sa.column("fecha_hora_inicio", sa.DateTime(timezone=True)),
            sa.column("fecha_hora_fin", sa.DateTime(timezone=True)),
            sa.column("monto_pago", sa.Numeric(14, 2)),
            sa.column("estado_pago", sa.String()),
            sa.column("created_at", sa.DateTime(timezone=True)),
        ),
        [
            {
                "id": 1,
                "espacio_comun_id": espacio_quincho_id,
                "usuario_id": usuario_residente_id,
                "fecha_hora_inicio": now + timedelta(days=7),
                "fecha_hora_fin": now + timedelta(days=7, hours=4),
                "monto_pago": Decimal("10000.00"),
                "estado_pago": "pendiente",
                "created_at": now,
            }
        ],
    )


def downgrade() -> None:
    op.drop_index("idx_anuncios_condominio_id", table_name="anuncios")
    op.drop_table("anuncios")

    op.drop_index("idx_pagos_usuario_id", table_name="pagos")
    op.drop_index("idx_pagos_gasto_id", table_name="pagos")
    op.drop_table("pagos")

    op.drop_index("idx_reservas_usuario_id", table_name="reservas")
    op.drop_index("idx_reservas_espacio_id", table_name="reservas")
    op.drop_table("reservas")

    op.drop_index("idx_espacios_condominio_id", table_name="espacios_comunes")
    op.drop_table("espacios_comunes")

    op.drop_index("idx_multas_vivienda_id", table_name="multas")
    op.drop_table("multas")

    op.drop_index("idx_gastos_vivienda_id", table_name="gastos_comunes")
    op.drop_table("gastos_comunes")

    op.drop_index("idx_resviv_vivienda_id", table_name="residentes_viviendas")
    op.drop_index("idx_resviv_usuario_id", table_name="residentes_viviendas")
    op.drop_table("residentes_viviendas")

    op.drop_index("idx_viviendas_condominio_id", table_name="viviendas")
    op.drop_table("viviendas")

    op.drop_index("idx_usuarios_email", table_name="usuarios")
    op.drop_table("usuarios")

    op.drop_table("condominios")

