from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class Condominio(Base):
    __tablename__ = "condominios"
    __table_args__ = (
        UniqueConstraint("nombre", name="uq_condominios_nombre"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    nombre = Column(String(200), nullable=False)
    direccion = Column(String(300), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    viviendas = relationship("Vivienda", back_populates="condominio", cascade="all,delete-orphan")
    espacios = relationship("EspacioComun", back_populates="condominio", cascade="all,delete-orphan")
    anuncios = relationship("Anuncio", back_populates="condominio", cascade="all,delete-orphan")


class Vivienda(Base):
    __tablename__ = "viviendas"
    __table_args__ = (
        UniqueConstraint("condominio_id", "numero_vivienda", name="uq_viviendas_condominio_numero"),
        Index("idx_viviendas_condominio_id", "condominio_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    condominio_id = Column(
        BigInteger,
        ForeignKey("condominios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    numero_vivienda = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    cargo_fijo_uf = Column(Numeric(10, 2), nullable=False, server_default="0")

    condominio = relationship("Condominio", back_populates="viviendas")
    residentes = relationship("ResidenteVivienda", back_populates="vivienda", cascade="all,delete-orphan")
    gastos = relationship("GastoComun", back_populates="vivienda", cascade="all,delete-orphan")
    multas = relationship("Multa", back_populates="vivienda", cascade="all,delete-orphan")


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        UniqueConstraint("email", name="uq_usuarios_email"),
        Index("idx_usuarios_email", "email"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(254), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(200), nullable=False)
    rol = Column(String(30), nullable=False, server_default="Residente")
    is_active = Column(Boolean, nullable=False, server_default="true")
    last_login = Column(DateTime(timezone=True))
    notificaciones_email = Column(Boolean, nullable=False, server_default="true")
    notificaciones_push = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    viviendas = relationship("ResidenteVivienda", back_populates="usuario", cascade="all,delete-orphan")
    reservas = relationship("Reserva", back_populates="usuario")
    pagos = relationship("Pago", back_populates="usuario")
    anuncios = relationship("Anuncio", back_populates="autor")


class ResidenteVivienda(Base):
    __tablename__ = "residentes_viviendas"
    __table_args__ = (
        Index("idx_resviv_usuario_id", "usuario_id"),
        Index("idx_resviv_vivienda_id", "vivienda_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )
    vivienda_id = Column(
        BigInteger,
        ForeignKey("viviendas.id", onupdate="CASCADE", ondelete="CASCADE"),
        primary_key=True,
    )

    usuario = relationship("Usuario", back_populates="viviendas")
    vivienda = relationship("Vivienda", back_populates="residentes")


class GastoComun(Base):
    __tablename__ = "gastos_comunes"
    __table_args__ = (
        UniqueConstraint("vivienda_id", "mes", "ano", name="uq_gastos_vivienda_mes_ano"),
        CheckConstraint("mes BETWEEN 1 AND 12", name="chk_mes"),
        CheckConstraint("ano >= 2000", name="chk_ano"),
        CheckConstraint("monto_total >= 0", name="chk_monto_total"),
        Index("idx_gastos_vivienda_id", "vivienda_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    vivienda_id = Column(
        BigInteger,
        ForeignKey("viviendas.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    mes = Column(Integer, nullable=False)
    ano = Column(Integer, nullable=False)
    monto_total = Column(Numeric(14, 2), nullable=False)
    estado = Column(String(20), nullable=False, server_default="pendiente")
    vencimiento = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    vivienda = relationship("Vivienda", back_populates="gastos")
    pagos = relationship("Pago", back_populates="gasto", cascade="all,delete-orphan")


class Multa(Base):
    __tablename__ = "multas"
    __table_args__ = (
        CheckConstraint("monto >= 0", name="chk_multa_monto"),
        Index("idx_multas_vivienda_id", "vivienda_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    vivienda_id = Column(
        BigInteger,
        ForeignKey("viviendas.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    monto = Column(Numeric(14, 2), nullable=False)
    descripcion = Column(String(500))
    fecha_aplicada = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    vivienda = relationship("Vivienda", back_populates="multas")


class EspacioComun(Base):
    __tablename__ = "espacios_comunes"
    __table_args__ = (
        UniqueConstraint("condominio_id", "nombre", name="uq_espacios_condominio_nombre"),
        Index("idx_espacios_condominio_id", "condominio_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    condominio_id = Column(
        BigInteger,
        ForeignKey("condominios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    nombre = Column(String(150), nullable=False)
    requiere_pago = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    condominio = relationship("Condominio", back_populates="espacios")
    reservas = relationship("Reserva", back_populates="espacio", cascade="all,delete-orphan")


class Reserva(Base):
    __tablename__ = "reservas"
    __table_args__ = (
        CheckConstraint("fecha_hora_fin > fecha_hora_inicio", name="chk_reservas_fechas"),
        Index("idx_reservas_espacio_id", "espacio_comun_id"),
        Index("idx_reservas_usuario_id", "usuario_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    espacio_comun_id = Column(
        BigInteger,
        ForeignKey("espacios_comunes.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    fecha_hora_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_hora_fin = Column(DateTime(timezone=True), nullable=False)
    monto_pago = Column(Numeric(14, 2), nullable=False, server_default="0")
    estado_pago = Column(String(20), nullable=False, server_default="pendiente")
    google_event_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    espacio = relationship("EspacioComun", back_populates="reservas")
    usuario = relationship("Usuario", back_populates="reservas")


class Pago(Base):
    __tablename__ = "pagos"
    __table_args__ = (
        CheckConstraint("monto_pagado >= 0", name="chk_pagos_monto"),
        Index("idx_pagos_gasto_id", "gasto_comun_id"),
        Index("idx_pagos_usuario_id", "usuario_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    gasto_comun_id = Column(
        BigInteger,
        ForeignKey("gastos_comunes.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    usuario_id = Column(
        BigInteger,
        ForeignKey("usuarios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    monto_pagado = Column(Numeric(14, 2), nullable=False)
    fecha_pago = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    metodo_pago = Column(String(30), nullable=False, server_default="webpay")

    gasto = relationship("GastoComun", back_populates="pagos")
    usuario = relationship("Usuario", back_populates="pagos")


class Anuncio(Base):
    __tablename__ = "anuncios"
    __table_args__ = (
        Index("idx_anuncios_condominio_id", "condominio_id"),
        {"mysql_charset": "utf8mb4", "mysql_engine": "InnoDB"},
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    condominio_id = Column(
        BigInteger,
        ForeignKey("condominios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    titulo = Column(String(200), nullable=False)
    contenido = Column(String(5000), nullable=False)
    tipo = Column(String(50), nullable=False, server_default="general")
    autor_id = Column(
        BigInteger,
        ForeignKey("usuarios.id", onupdate="CASCADE", ondelete="RESTRICT"),
        nullable=False,
    )
    fecha_publicacion = Column(Date, nullable=False)
    fecha_expiracion = Column(Date)
    is_active = Column(Boolean, nullable=False, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    condominio = relationship("Condominio", back_populates="anuncios")
    autor = relationship("Usuario", back_populates="anuncios")