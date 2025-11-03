import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelfConfigHeaderComponent } from './self-config-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SelfConfigHeaderComponent', () => {
  let component: SelfConfigHeaderComponent;
  let fixture: ComponentFixture<SelfConfigHeaderComponent>;
  CommonTestingModule.setUpTestBed(SelfConfigHeaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfConfigHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
