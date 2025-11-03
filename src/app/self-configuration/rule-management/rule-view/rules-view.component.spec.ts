import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RulesViewComponent } from './rules-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('RulesViewComponent', () => {
  let component: RulesViewComponent;
  let fixture: ComponentFixture<RulesViewComponent>;
  CommonTestingModule.setUpTestBed(RulesViewComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RulesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
