import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SvmsDragTableComponent } from './svms-drag-table.component';

describe('SvmsDragTableComponent', () => {
  let component: SvmsDragTableComponent;
  let fixture: ComponentFixture<SvmsDragTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SvmsDragTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SvmsDragTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
