import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ControlPanelHeaderComponent } from './control-panel-header.component';

describe('ControlPanelHeaderComponent', () => {
  let component: ControlPanelHeaderComponent;
  let fixture: ComponentFixture<ControlPanelHeaderComponent>;
  CommonTestingModule.setUpTestBed(ControlPanelHeaderComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ControlPanelHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ControlPanelHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
